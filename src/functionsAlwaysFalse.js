const alwaysFalseFunctionsToBody = new Map([
    ['awlui', `
          function awlui() {
            if (this[[] + {} + {}]) return false;
            this[[] + {} + {}]= true;
            const res = navigator.userAgent.length < (500 + 877.83 * Math.random());
            this[[] + {} + {}] = false;
            return !res;
          }  
        `],
    ['dodsjsswdlo', `
          function dodsjsswdlo() {
            if (this[{}+{}+[]]) return false;
            this[{}+{}+[]]= true;
            const res = typeof navigator.webdriver !== 'undefined' && navigator.webdriver === '27sdfh28__sel' ? true : (Math.random() < ([] + {}));
            this[{}+{}+[]] = false;
            return res;
          }
        `],

]);

exports.functions = alwaysFalseFunctionsToBody;