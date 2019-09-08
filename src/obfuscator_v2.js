const { RefactorSession } = require('shift-refactor');
const { parseScript } = require('shift-parser');
const Shift = require('shift-ast');
const alwaysTrueFunctionsToBody = require('./functionsAlwaysTrue.js').functions;
const alwaysFalseFunctionsToBody = require('./functionsAlwaysFalse.js').functions;

const fs = require('fs');

function shuffle(array) {
    let currentIndex = array.length, temporaryValue, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

function encode64(input, keyStr) {
    if (!String(input).length) return false;
    var output = "";
    var chr1, chr2, chr3;
    var enc1, enc2, enc3, enc4;
    var i = 0;

    do {
        chr1 = input.charCodeAt(i++);
        chr2 = input.charCodeAt(i++);
        chr3 = input.charCodeAt(i++);

        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;

        if (isNaN(chr2)) {
            enc3 = enc4 = 64;
        } else if (isNaN(chr3)) {
            enc4 = 64;
        }
        output = output + keyStr.charAt(enc1) + keyStr.charAt(enc2) +
            keyStr.charAt(enc3) + keyStr.charAt(enc4);
    } while (i < input.length);

    return output;
}

function generateRandomString(length) {
    const result = [];
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++ ) {
        result.push(characters.charAt(Math.floor(Math.random() * charactersLength)));
    }
    return result.join('');
}

function obfuscateFPScript(src, dest) {
    const fileContents = fs.readFileSync(src, 'utf8');
    const tree = parseScript(fileContents);
    const refactor = new RefactorSession(tree);

    const alwaysTrueFunctions = Array.from(alwaysTrueFunctionsToBody.keys());
    function selectRandomFunction(alwaysTrueFunctions) {
        return alwaysTrueFunctions[Math.floor(alwaysTrueFunctions.length * Math.random())];
    }

    alwaysTrueFunctionsToBody.forEach((fBody) => {
        const alwaysTrueFuncAst = parseScript(fBody).statements[0];
        refactor.query('Script')[0].statements.unshift(alwaysTrueFuncAst);
    });

    const alwaysFalseFunctions = Array.from(alwaysFalseFunctionsToBody.keys());

    alwaysFalseFunctionsToBody.forEach((fBody) => {
        const alwaysFalseFuncAst = parseScript(fBody).statements[0];
        refactor.query('Script')[0].statements.unshift(alwaysFalseFuncAst);
    });

    const alphabetPropertyName = generateRandomString(6);
    const alphabet = shuffle("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="
        .split(''))
        .join('');

    const transformationsConfig = {
        frequency: {
            'encoding': 0.7,
            'ternary':  0.3
        },
        maxSplits: 4
    };

    const stringsProgram = Array.from(new Set(refactor.query('LiteralStringExpression').map(v => v.value)));
    const numbersProgram = Array.from(new Set(refactor.query('LiteralNumericExpression').map(v => v.value)));
    const bindingProperties = Array.from(new Set(refactor.query('AssignmentExpression[binding.type="StaticMemberAssignmentTarget"]').map(v => v.binding.property)));
    const expStatementStr = Array.from(new Set(refactor.query('ExpressionStatement[expression.expression.type="StaticMemberExpression"]').map(exp => exp.expression.expression.property)));
    const staticMemberStr = Array.from(new Set(refactor.query('StaticMemberExpression').map(v => v.property)));

    const staticLiterals = stringsProgram.concat(numbersProgram, bindingProperties, expStatementStr, staticMemberStr);

    function splitStringLiteral(lit, maxNumSplits) {
        maxNumSplits = Math.min(maxNumSplits, lit.length);
        const numSplits = Math.max(1, Math.floor(maxNumSplits*Math.random()));
        const splits = new Set();
        while (splits.size < numSplits) {
            splits.add(Math.max(1, Math.floor(lit.length * Math.random())));
        }

        const orderedSplits = Array.from(splits);
        orderedSplits.sort((a, b) => a-b);
        const literalChunks = orderedSplits.map((v, idx) => {
            if(idx === 0) {
                return lit.substring(0, v);
            } else if (idx < orderedSplits.length -1 ) {
                return lit.substring(orderedSplits[idx-1], v);
            } else {
                return lit.substring(orderedSplits[idx-1]);
            }
        });

        if (numSplits === 1) {
            literalChunks.push(lit.substring(orderedSplits[0]))
        }
        return literalChunks;
    }

    const subLiterals = new Set(); // To save space, we keep each substring only once
    const staticLiteralToChunks = new Map(staticLiterals.map(lit => {
        let subLit;
        if (typeof lit === 'string') {
            subLit = splitStringLiteral(lit, transformationsConfig.maxSplits);
        } else {
            subLit = [lit]
        }

        subLit.forEach(v => subLiterals.add(v));
        return [lit, subLit]; // we don't split numbers for the moment
    }));

    const subLitArr = Array.from(subLiterals);
    const subLiteralToIndex = new Map(subLitArr.map((v, idx) => [v, idx]));
    const staticLiteralToIndexChunks = new Map();
    staticLiteralToChunks.forEach((v, k) => {
        const indexChunks = v.map(subLit => subLiteralToIndex.get(subLit));
        staticLiteralToIndexChunks.set(k, indexChunks);
    });


    // Add array with all sub-literal members
    refactor.query('Script')[0].statements.unshift(new Shift.VariableDeclarationStatement({
        declaration: new Shift.VariableDeclaration({
            kind: 'const',
            declarators: [new Shift.VariableDeclarator({
                binding: new Shift.BindingIdentifier({
                    name: 'members'
                }),
                init: new Shift.ArrayExpression({
                    elements: subLitArr.map((lit) => {
                        if (typeof lit === 'string') {
                            return new Shift.LiteralStringExpression({
                                value: encode64(lit, alphabet)
                            })
                        } else if (typeof lit === 'number') {
                            return new Shift.LiteralNumericExpression({
                                value: lit
                            })
                        }
                    })
                })
            })]
        })
    }));

    // Add function to map an index to a literal
    const indexToStr = `
    function indexToLiteral(index, arr) {
        if (typeof arr[index] ==='string') return decode64(arr[index], window['${alphabetPropertyName}']);
            return arr[index];
    }`;

    const indexToStrAst = parseScript(indexToStr).statements[0];
    refactor.query('Script')[0].statements.unshift(indexToStrAst);

    function buildIndexToLitCallExpression(indexes, transformationsConfig) {
        const tree = parseScript(
            indexes.map(idx => {
                const rd = Math.random();

                if (rd < transformationsConfig.frequency.encoding) {
                    return `indexToLiteral(${idx}, members)`
                } else if (rd >= transformationsConfig.frequency.encoding) { // Only 2 families of transformations for the moment
                    const numSubTransfo = 4;
                    const interval = (transformationsConfig.frequency.ternary) / numSubTransfo;

                    if (rd <= transformationsConfig.frequency.encoding + interval) {
                        return `(${selectRandomFunction(alwaysFalseFunctions)}() ? '${generateRandomString(Math.max(3, Math.floor(8*Math.random())))}' : indexToLiteral(${idx}, members))`;
                    } else if (rd < transformationsConfig.frequency.encoding + 2 * interval) {
                        return `(${selectRandomFunction(alwaysFalseFunctions)}() ? indexToLiteral(${Math.floor(subLitArr.length * Math.random())}, members) : indexToLiteral(${idx}, members))`;
                    } else if (rd < transformationsConfig.frequency.encoding + 3 * interval) {
                        return `(${selectRandomFunction(alwaysTrueFunctions)}() ? indexToLiteral(${idx}, members) : '${generateRandomString(Math.max(3, Math.floor(8*Math.random())))}')`;
                    } else if (rd <= transformationsConfig.frequency.encoding + 4 * interval) {
                        return `(${selectRandomFunction(alwaysTrueFunctions)}() ? indexToLiteral(${idx}, members) : indexToLiteral(${Math.floor(subLitArr.length * Math.random())}, members))`;
                    }
                }
            })
            .join(' +')
        );

        return tree.statements[0].expression;
    }

    // Code transformations
    refactor.query('CallExpression')
        .forEach(callExpression => {
            callExpression.arguments.forEach((argument, idx) => {
                if (argument.type === 'LiteralStringExpression' || argument.type === 'LiteralNumericExpression') {
                    callExpression.arguments[idx] = buildIndexToLitCallExpression(staticLiteralToIndexChunks.get(argument.value), transformationsConfig)
                }
            });
        });

    // Assignments of the form myobj.prop = val; => myobj[func(idx, arr)] = val;
    refactor.query('AssignmentExpression[binding.type="StaticMemberAssignmentTarget"]')
        .forEach(assignmentExpression => {
            assignmentExpression.binding = new Shift.ComputedMemberAssignmentTarget({
                object:  assignmentExpression.binding.object,
                expression: buildIndexToLitCallExpression(staticLiteralToIndexChunks.get(assignmentExpression.binding.property), transformationsConfig)
            });
        });

    refactor.query(':matches(ExpressionStatement[expression.expression.type="LiteralStringExpression"], ' +
        'ExpressionStatement[expression.expression.type="LiteralNumericExpression"])')
        .forEach((exp) => {
            exp.expression.expression = buildIndexToLitCallExpression(staticLiteralToIndexChunks.get(exp.expression.expression.value), transformationsConfig)
        });


    refactor.query('VariableDeclarationStatement')
        .forEach((exp) => {
            exp.declaration.declarators.forEach((declarator) => {
                if (declarator.init.type === 'LiteralNumericExpression' || declarator.init.type === 'LiteralStringExpression') {
                    declarator.init = buildIndexToLitCallExpression(staticLiteralToIndexChunks.get(declarator.init.value), transformationsConfig)
                }
            })
        });

    refactor.query('StaticMemberExpression')
        .forEach((exp) => {
            exp.type = 'ComputedMemberExpression';
            exp.expression = buildIndexToLitCallExpression(staticLiteralToIndexChunks.get(exp.property), transformationsConfig);
            delete exp.property;
        });

    const alphabetElement = parseScript(`window['${alphabetPropertyName}'] = '${alphabet}'`).statements[0];
    refactor.query('Script')[0].statements.unshift(alphabetElement);

    const decodeBody = `function decode64(input, keyStr) {
       if (!input) return false;
       var output = "";
       var chr1, chr2, chr3;
       var enc1, enc2, enc3, enc4;
       var i = 0;
    
       // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
       input = input.replace(/[^A-Za-z0-9\\+\\/\\=]/g, "");
    
       do {
          enc1 = keyStr.indexOf(input.charAt(i++));
          enc2 = keyStr.indexOf(input.charAt(i++));
          enc3 = keyStr.indexOf(input.charAt(i++));
          enc4 = keyStr.indexOf(input.charAt(i++));
    
          chr1 = (enc1 << 2) | (enc2 >> 4);
          chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
          chr3 = ((enc3 & 3) << 6) | enc4;
    
          output = output + String.fromCharCode(chr1);
    
          if (enc3 != 64) {
             output = output + String.fromCharCode(chr2);
          }
          if (enc4 != 64) {
             output = output + String.fromCharCode(chr3);
          }
       } while (i < input.length);
    
       return output;
    }`;

    const decodeBodyAst = parseScript(decodeBody).statements[0];
    refactor.query('Script')[0].statements.unshift(decodeBodyAst);

    fs.writeFileSync(dest, refactor.print(), 'utf8');
}

exports.obfuscate = obfuscateFPScript;