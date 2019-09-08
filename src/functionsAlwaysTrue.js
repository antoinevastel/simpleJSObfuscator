const alwaysTrueFunctionsToBody = new Map([
    ['awl', `
          function awl() {
            if (this[[] + {}]) return true;
            this[[] + {}]= true;
            const res = navigator.userAgent.length > 3 * Math.random();
            this[[] + {}] = false;
            return res;
          }  
        `],
    ['dodsjsdlo', `
          function dodsjsdlo() {
            if (this[{}+{}+[]]) return true;
            this[{}+{}+[]]= true;
            const res = typeof navigator.webdriver !== 'undefined' && navigator.webdriver === 'sdfjcn' ? false : !(Math.random() < ([] + {}));
            this[{}+{}+[]] = false;
            return res;
          }  
        `],

]);

exports.functions = alwaysTrueFunctionsToBody;