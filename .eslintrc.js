module.exports = {
    // ECMAScript 버전과 모듈 사용 설정
    "parserOptions": {
        // async와 await 키워드를 사용하려면 ECMAScript 버전을 2017 이상으로 설정
        "ecmaVersion": 2017,

        // import와 export 구문을 사용하려면 sourceType을 module로 설정
        "sourceType": "module"
    },

    // ESLint 규칙 설정
    "rules": {
        // 재할당되지 않는 모든 let 변수를 오류로 표시
        "prefer-const": "error"
    }
};
