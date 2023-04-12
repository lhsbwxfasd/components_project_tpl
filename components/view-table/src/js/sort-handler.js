import Common from "./common/index.js"
let Sort = Common.property.extend({
    _opt() {
        return {
            sortType: null,
            sortId: "",
            sortAsc: true,
            sortComparers: null,
            sortFast: null,
            sortFastAsc: true,
            blankToBottom: true,
            unsortFn(row) {
                if (row._fixed) {
                    return {
                        row: row,
                        top: true
                    };
                }
                if (row._unsort) {
                    return {
                        row: row,
                        top: row._unsortToTop
                    };
                }
                return null;
            }
        };
    },
    _doComparer() {
        let opt = this.opt;
        let sortType = opt.sortType;
        let comparer = this._getComparer(sortType);
        if (!comparer) {
            return;
        }
        let self = this;
        this.rows.sort((a, b) => {
            return comparer.call(self, a, b, {
                sortId: opt.sortId,
                sortAscDesc: opt.sortAsc ? -1 : 1,
                blankToBottom: opt.blankToBottom
            });
        });
    },
    _getComparer(sortType) {
        let sortComparers = this.opt.sortComparers;
        let comparer = null;
        if (sortType) {
            comparer = sortComparers[sortType];
        }
        comparer = comparer || sortComparers.string;
        return comparer;
    },
    _setSortIndex() {
        this.rows.forEach((row, index) => {
            row._sortIndex = index
        })
    },
    _spliceUnsortsFromRows() {
        this._unsortToTop = [];
        this._unsortToBottom = [];
        let unsortFn = this.opt.unsortFn;
        for (let i = 0, l = this.rows.length; i < l; i++) {
            let row = this.rows[i];
            let unsortInfo = unsortFn(row);
            if (unsortInfo) {
                if (unsortInfo.top) {
                    this._unsortToTop.unshift(unsortInfo);
                } else {
                    this._unsortToBottom.push(unsortInfo);
                }
                //remove from old rows
                this.rows.splice(i, 1);
                i--;
                l--;
            }
        }
    },
    _pushUnsortsToRowsTopBottom() {
        let rows = this.rows
        this._unsortToTop.forEach((unsortInfo) => {
            rows.unshift(unsortInfo.row);
        });
        this._unsortToBottom.forEach((unsortInfo) => {
            rows.push(unsortInfo.row);
        });
    },
    constructor(opt) {
        this.opt = Common.merge(this._opt(), opt);
    },
    sortRows(rows) {
        if (!Common.isArray(rows)) {
            return false;
        }
        this.rows = rows;
        let opt = this.opt;
        if (!opt.sortId) {
            return false;
        }
        this._setSortIndex();
        let sorted = false;
        this._spliceUnsortsFromRows();
        if (opt.sortFast) {
            if (opt.sortFastAsc !== opt.sortAsc) {
                this.rows.reverse();
                sorted = true;
            }
        } else {
            this._doComparer();
            sorted = true;
        }
        this._pushUnsortsToRowsTopBottom();
        return sorted;
    }
});
export default  Sort;