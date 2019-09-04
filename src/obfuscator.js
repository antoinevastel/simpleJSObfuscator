const { RefactorSession } = require('shift-refactor');
const { parseScript } = require('shift-parser');
const Shift = require('shift-ast');

const fs = require('fs');

function obfuscateFPScript(src, dest) {
    const fileContents = fs.readFileSync(src, 'utf8');
    const tree = parseScript(fileContents);
    const refactor = new RefactorSession(tree);

    const stringsProgram = Array.from(new Set(refactor.query('LiteralStringExpression').map(v => v.value)));
    const numbersProgram = Array.from(new Set(refactor.query('LiteralNumericExpression').map(v => v.value)));
    const bindingProperties = Array.from(new Set(refactor.query('AssignmentExpression[binding.type="StaticMemberAssignmentTarget"]').map(v => v.binding.property)));
    const expStatementStr = Array.from(new Set(refactor.query('ExpressionStatement[expression.expression.type="StaticMemberExpression"]').map(exp => exp.expression.expression.property)));
    const staticMemberStr = Array.from(new Set(refactor.query('StaticMemberExpression').map(v => v.property)));

    const staticLiterals = stringsProgram.concat(numbersProgram, bindingProperties, expStatementStr, staticMemberStr);
    const staticLiteralToIndex = new Map(staticLiterals.map((lit, idx) => [lit, idx]));

    function buildIndexToLitCallExpression(index) {
        return new Shift.CallExpression({
            callee: new Shift.IdentifierExpression({
                name: 'indexToLiteral'
            }),
            arguments: [
                new Shift.LiteralNumericExpression({
                    value: index
                }),
                new Shift.IdentifierExpression({
                    name: 'members'
                })

            ]
        })
    }

// Add array with all static members

    refactor.query('Script')[0].statements.unshift(new Shift.VariableDeclarationStatement({
        declaration: new Shift.VariableDeclaration({
            kind: 'const',
            declarators: [new Shift.VariableDeclarator({
                binding: new Shift.BindingIdentifier({
                    name: 'members'
                }),
                init: new Shift.ArrayExpression({
                    elements: staticLiterals.map((lit) => {
                        if (typeof lit === 'string') {
                            return new Shift.LiteralStringExpression({
                                value: new Buffer.from(lit).toString('base64')
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
        if (typeof arr[index] ==='string') return atob(arr[index]);
            return arr[index];
    }`;

    const indexToStrAst = parseScript(indexToStr).statements[0];
    refactor.query('Script')[0].statements.unshift(indexToStrAst);

    refactor.query('CallExpression')
        .forEach(callExpression => {
            callExpression.arguments.forEach((argument, idx) => {
                if (argument.type === 'LiteralStringExpression' || argument.type === 'LiteralNumericExpression') {
                    callExpression.arguments[idx] = buildIndexToLitCallExpression(staticLiteralToIndex.get(argument.value))
                }
            });
        });

    // Assignments of the form myobj.prop = val; => myobj[func(idx, arr)] = val;
    refactor.query('AssignmentExpression[binding.type="StaticMemberAssignmentTarget"]')
        .forEach(assignmentExpression => {
            assignmentExpression.binding = new Shift.ComputedMemberAssignmentTarget({
                object:  assignmentExpression.binding.object,
                expression: buildIndexToLitCallExpression(staticLiteralToIndex.get(assignmentExpression.binding.property))
            });
        });

    refactor.query(':matches(ExpressionStatement[expression.expression.type="LiteralStringExpression"], ' +
        'ExpressionStatement[expression.expression.type="LiteralNumericExpression"])')
        .forEach((exp) => {
            exp.expression.expression = buildIndexToLitCallExpression(staticLiteralToIndex.get(exp.expression.expression.value))
        });

    refactor.query('VariableDeclarationStatement')
        .forEach((exp) => {
            exp.declaration.declarators.forEach((declarator) => {
                if (declarator.init.type === 'LiteralNumericExpression' || declarator.init.type === 'LiteralStringExpression') {
                    declarator.init = buildIndexToLitCallExpression(staticLiteralToIndex.get(declarator.init.value))
                }
            })
        });

    refactor.query('StaticMemberExpression')
        .forEach((exp) => {
            exp.type = 'ComputedMemberExpression';
            exp.expression = buildIndexToLitCallExpression(staticLiteralToIndex.get(exp.property));
            delete exp.property;
        });

    fs.writeFileSync(dest, refactor.print(), 'utf8');
}

exports.obfuscate = obfuscateFPScript;