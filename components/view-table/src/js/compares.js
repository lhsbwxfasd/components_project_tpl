function compareStr(a, b) {
    let a_isStr = typeof(a) === "string";
    let b_isStr = typeof(b) === "string";
    if (a_isStr && b_isStr) {
        return b.localeCompare(a)
    }
    return a > b ? -1 : 1;
}

function compareNum(a, b) {
    let a_isNum = typeof(a) === "number"
    let b_isNum = typeof(b) === "number"
    if (a_isNum && b_isNum) {
        return a > b ? -1 : 1
    }
    if (a_isNum) {
        return -1
    }
    if (b_isNum) {
        return 1
    }
    return compareStr(a, b)
}

function isEmpty(value) {
    if (!value && value !== 0) {
        return true;
    } else if(value === "--") {
        return true
    }
    return false;
}

function comparerEmpty(a, b) {
    let a_isEmpty = isEmpty(a)
    let b_isEmpty = isEmpty(b)
    if(a_isEmpty && b_isEmpty) {
        return 0
    }
    if(a_isEmpty) {
        return 1
    }
    if(b_isEmpty) {
        return -1
    }
}

function compareIndex(a, b) {
    return a._sortIndex > b._sortIndex ? 1 : -1
}

export default {
    string(a, b, opt) {
        let a_value = a[opt.sortId]
        let b_value = b[opt.sortId]
        let _comparerEmpty = comparerEmpty(a_value, b_value, opt);
        if (_comparerEmpty) {
            if(opt.blankToBottom) {
                return _comparerEmpty;
            }else {
                return opt.sortAscDesc * _comparerEmpty;
            }
        }
        if(_comparerEmpty !== 0 && a_value !== b_value) {
            return opt.sortAscDesc * compareStr(a_value, b_value)
        }
        return compareIndex(a, b)
        
    },
    number(a, b, opt) {
        let a_value = a[opt.sortId]
        let b_value = b[opt.sortId]
        let _comparerEmpty = comparerEmpty(a_value, b_value);
        if (_comparerEmpty) {
            if(opt.blankToBottom) {
                return _comparerEmpty;
            }else {
                return opt.sortAscDesc * _comparerEmpty;
            }
        }
        if(_comparerEmpty !== 0 && a_value !== b_value) {
            return opt.sortAscDesc * compareNum(a_value, b_value)
        }
        return compareIndex(a, b)
    }
}