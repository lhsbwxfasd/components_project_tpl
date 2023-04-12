let $ = window["jQuery"] || require("jquery")
import Common from "./common/index.js"
import Table from "./table-base/index.js"
import Compares from "./compares.js"
import SortHandler from "./sort-handler.js"
import Opt from "./default-opts.js"
import Fat from "./default-fat.js"
import Editor from "./default-editor.js"

let ViewTable = Common.property.extend({
    _eventsName() {
        return [
            "onHeaderContextMenu",
            "onHeaderClick",
            "onHeaderDblClick",
            "onHeaderMouseOver",
            "onHeaderMouseOut",
            "onHeaderMouseEnter",
            "onHeaderMouseLeave",
            "onHeaderCreated",
            "onSort",
            "onColWidthChanged",
            "startColWidthChange",
            "updateColWidthChange",
            "doneColWidthChange",
            "onRowMouseEnter",
            "onRowMouseLeave",
            "onCellRendered",
            "onCellMouseOut",
            "onCellMouseOver",
            "onCellMouseLeave",
            "onCellMouseEnter",
            "onClick",
            "onDblClick",
            "onContextMenu",
            "onMouseWheel",
            "onScroll",
            "onScrollStatusChanged",
            "onMultiLevelClick",
            "onMultiLevelAllClick",
            "onCheckboxClick",
            "onCheckboxTotalClick",

            "onFocusedChanged",
            "onActiveCellChanged",
            "onCellEditStart",
            "onCellEditRendered",
            "onCellEditValueChanging",
            "onCellEditValueChanged",
            "onCellEditComplete",
            "onCellEditError",
            "onCellEditDestroy",

            "onRenderStart",
            "onRenderUpdate",
            "onRenderComplete",
            "onDestroy"
        ]
    },
    _opt() {
        return Opt;
    },
    _fat() {
        return Fat;
    },
    _editor() {
        return Editor;
    },
    _attachEvent() {
        let self = this;
        let events = this._eventsName()
        events.forEach((event) => {
            if (self["_" + event]) {
                self.bind(event, self["_" + event])
            }
            self.table.bind(event, (e, d) => {
                self.trigger(event, d)
            });
        })
    },
    _onMultiLevelClick(e, d) {
        this.toggleItem(d.rowIndex)
    },
    _onMultiLevelAllClick(e, d) {
        this.toggleAll();
    },
    _onSort(e, d) {
        this.setSortCol(d.col);
    },
    _onHeaderCreated(e, d) {
        this.initCollapseTotal(e, d);
        this.initCheckboxTotal(e, d);
    },
    _onCheckboxClick(e, d) {
        this.setSectRow(d.rowIndex, d.e);
    },
    _onCheckboxTotalClick(e, d) {
        let sectAll = false;
        let $checkboxTotal = $(d.el);
        if ($checkboxTotal.hasClass("vt-_sect")) {
            sectAll = true;
        }
        sectAll = !sectAll;
        this.opt.sectAll = sectAll;
        if (sectAll) {
            this.sectAll();
        } else {
            this.unsectAll();
        }
    },
    _startColWidthChange(e, d) {
        this.table.$headerBodys.addClass("vt-ew-resize");
        let elemBar = $(d.target).addClass("vt-active");
        let elemCol = elemBar.prev();
        let index = parseInt(elemCol.attr("idx"), 10);
        d.index = index;
        let col = this.getCol(index);
        d.col = col;
        let $el = this.getHeaderEl(col);
        d.width = $el.innerWidth();
    },

    _updateColWidthChange(e, d) {
        let newWidth = d.width + d.mouseOffsetX;
        this.table.setColWidth(d.col, newWidth);
    },

    _doneColWidthChange(e, d) {
        if (!d.valid) {
            return;
        }
        this.table.$headerBodys.removeClass("vt-ew-resize");
        $(d.target).removeClass("vt-active");
        this.table.resize();
    },

    _setColsRowsArr() {
        this.tableAllCols = [];
        this.tableCols = [];
        this.tableRows = [];
    },

    _initCheckBoxSpaceCols() {
        this._spaceCol = {
            id: "vt_space_col",
            name: "",
            fat: "space",
            colClass: "vt-header-space",
            colNameClass: "vt-header-name-space",
            cellClass: "vt-td-space",
            width: 1,
            minWidth: 1,
            maxWidth: 2000,
            resizable: false,
            sortable: false
        }
        this._checkboxCol = {
            id: "vt_checkbox_col",
            name: "",
            fat: "checkbox",
            colClass: "vt-header-checkbox",
            colNameClass: "vt-header-name-checkbox",
            cellClass: "vt-td-checkbox",
            width: 30,
            resizable: false,
            sortable: false
        }
        let space = this._spaceCol;
        Common.delListItem(this.cols, {
            id: space.id
        });
        this.cols.push(space);
        if (this.opt.enCheckbox) {
            let checkbox = this._checkboxCol;
            Common.delListItem(this.cols, {
                id: checkbox.id
            });
            this.cols.unshift(checkbox);
        }
    },
    _addIndexAttrToColsRows(list) {
        let i = 0;
        let l = list.length;
        while (i < l) {
            let item = list[i];
            item._index = i;
            i++;
        }
        return this;
    },

    constructor(container, opt, fat, editors) {
        this.create(container, opt, fat, editors);
    },
    create(container, opt, fat, editors) {
        if (!container) {
            return this;
        }
        this.container = container;
        this._instanceCacheInfo = {};
        this.table = new Table(container);
        this._setColsRowsArr()
        this._attachEvent()
        this.setEditor(editors);
        this.setOpt(opt);
        this.setFat(fat);
    },

    getRows() {
        return this.rows;
    },
    getCols() {
        return this.cols;
    },

    initRowsInfo() {
        this.opt.rowsInfo = this.getMultiLevelInfo(this.rows, this.opt.fixedRow);
    },

    initColsInfo() {
        this._initCheckBoxSpaceCols();
        this.opt.colsInfo = this.getMultiLevelInfo(this.cols, this.opt.fixedCol);
    },

    setOpt(opt) {
        this.opt = Common.merge(this._opt(), opt);
        this.resetAll = true;
        return this;
    },

    setEditor(editors) {
        this.editors = Common.merge(this._editor(), editors);
        this.resetAll = true;
        return this;
    },

    getEditor(type) {
        if (arguments.length) {
            return this.editors[type];
        }
        return this.editors;
    },

    setFat(fats) {
        this.fats = Common.merge(this._fat(), fats);
        this.resetAll = true;
        return this;
    },

    getFat(type) {
        if (arguments.length) {
            return this.fats[type];
        }
        return this.fats;
    },

    setData(cols, rows) {
        this.cols = cols || [];
        this.rows = rows || [];
        this.initColsInfo();
        this.initRowsInfo();
        this.resetAll = true;
        return this;
    },

    getCol(context) {
        if (Common.isNumber(context)) {
            return this.tableAllCols[context];
        }
        if (!context) {
            return null;
        }
        if (Common.isNumber(context._index)) {
            return this.tableAllCols[context._index];
        }
        return this.getColById(context.id || context);
    },
    getColById(id) {
        if (!id) {
            return null;
        }
        return this.getColBy({
            id: id
        });
    },
    getColBy(condition) {
        let colItem = Common.getListItem(this.tableAllCols, condition);
        return colItem;
    },
    getRow(context) {
        if (Common.isNumber(context)) {
            return this.tableRows[context];
        }
        if (!context) {
            return null;
        }
        if (Common.isNumber(context._index)) {
            return this.tableRows[context._index];
        }
        return this.getRowById(context.id || context);
    },
    getRowById(id) {
        if (!id) {
            return null;
        }
        return this.getRowBy({
            id: id
        });
    },
    getRowBy(condition) {
        let rowItem = Common.getListItem(this.tableRows, condition);
        return rowItem;
    },
    showHideNoDataTxt() {
        let nodataEl = this.container.find(".vt-table-nodata");
        nodataEl.html(this.opt.noDataText);
        if (this.rows.length === 0) {
            nodataEl.show();
        } else {
            nodataEl.hide();
        }
    },
    render(resetAll) {
        this.showHideNoDataTxt();

        if (resetAll) {
            this.resetAll = true;
        }
        if (this.resetAll) {
            this.initView();
        } else {
            this.updateView();
        }
        this.table.render();
        this.resetAll = false;
        return this;
    },

    initView() {
        this.clean();
        this.initTableColsData();
        this.initSort();
        this.initSect();
        this.initCollapse();
        this.initTableRowsData();
        this.table.setCols(this.tableCols, this.tableAllCols);
        this.table.setRows(this.tableRows);
        this.table.init(this.opt);

    },

    updateView() {
        if (!this.table.headerRendered) {
            return;
        }
        this.initTableRowsData();
        this.table.setRows(this.tableRows);
        this.table.updateBodySize();
        if (!this.rmRow) {
            return;
        }
        let rmIndex = this.rmRow._index;
        this.removeRowsFrom(rmIndex);
        this.rmRow = null;
        return this;
    },

    initTableColsData() {
        this._autoWidthCols = [];
        this._definedWidth = 0;
        this.tableAllCols.length = 0;
        this.tableCols.length = 0;
        let colsGroupData = [];
        let cols = this.getCols();
        let self = this;
        let _doSetTableCols = function(cols) {
            if (!Common.isArray(cols)) {
                return;
            }
            let len = cols.length;
            let index = 0;
            cols.forEach((col) => {
                col._listLength = len;
                col._listIndex = index;
                index++;

                self.initColOpt(col);
                self.initColEditor(col);
                self.initColFat(col);
                self.initColWidth(col);

                if (col._isMultiLevelGroup) {
                    colsGroupData.push(col);
                    _doSetTableCols(col.childs, col);
                } else {
                    self.tableCols.push(col);
                }

            });
        };
        _doSetTableCols(cols);
        //set auto width cols width
        this.initAutoWidthColsWidth()
        //end set
        this.tableAllCols = this.tableAllCols.concat(this.tableCols).concat(colsGroupData);
        this._addIndexAttrToColsRows(this.tableAllCols);
        this._setColHeaderInfo(cols, this.tableCols, colsGroupData);
        let lastColItem = this.tableCols[this.tableCols.length - 2];
        lastColItem.colClass = lastColItem.colClass || ""
        lastColItem.colClass += " vt-last-padding-right"
        lastColItem.cellClass = lastColItem.cellClass || ""
        lastColItem.cellClass += " vt-last-padding-right"
        return this;
    },

    _setColHeaderInfo(cols, tableCols, colsGroupData) {
        let maxLevel = this.opt.colsInfo.maxLevel;
        tableCols.forEach((col) => {
            col._reverseLevel = maxLevel;
            if (col._parent) {
                col._parent._reverseLevel = maxLevel - 1;
            }
        });

        let groupLength = colsGroupData.length;
        if (groupLength) {
            for (let i = groupLength - 1; i >= 0; i--) {
                let group = colsGroupData[i];
                group._trElMark = false;
                group.colspanNum = this._getColGroupColspan(group);
                group.width = this._getColGroupWidth(group);

                if (group._parent) {
                    group._parent._reverseLevel = group._reverseLevel - 1;
                } else {
                    group.topLevelOffset = group._reverseLevel;
                }
            }
        }
        this._setColRowspanNum(cols, 0, maxLevel, 0);
    },

    _setColRowspanNum(cols, rowLevel, maxLevel, trOffset) {
        let self = this;
        cols.forEach((col) => {
            col._trEl = rowLevel + trOffset;
            if (col._isMultiLevelGroup) {
                let offset = col.topLevelOffset;
                if (offset) {
                    col.rowspanNum = offset + 1;
                } else {
                    offset = trOffset;
                }
                self._setColRowspanNum(col.childs, rowLevel + 1, maxLevel, offset);
            } else {
                let rowspan = maxLevel + 1 - rowLevel - trOffset;
                if (rowspan > 1) {
                    col.rowspanNum = rowspan;
                }
            }
        });
    },

    _getColGroupColspan(col) {
        if (!col || !col.childs) {
            return 0;
        }
        let colspan = 0;
        col.childs.forEach((item) => {
            colspan += item.colspanNum || 1;
        });
        return colspan;
    },

    _getColGroupWidth(col) {
        if (!col || !col.childs) {
            return 0;
        }
        let w = 0;
        col.childs.forEach((item) => {
            w += item.width;
        });
        return w;
    },

    initColEditor(col) {
        if (col._isMultiLevelGroup) {
            return;
        }
        let editor = col.editor;
        if (editor && typeof(editor) === "string") {
            let editorHandler = this.getEditor(editor);
            if (editorHandler) {
                col._editor = editorHandler;
                if (!col.fat) {
                    col.fat = editor;
                }
            } else {
                col.editor = null;
                col._editor = null;
            }
        }
    },

    initColFat(col) {
        this.initColFatByType(col, "headerFat", "header");
        this.initColFatByType(col, "titleFat", "title");
        let colFat = this.getColFat(col);
        this.initColFatByType(col, "fat", colFat);
        return col;
    },

    initColOpt(col) {
        if (!col.id) {
            col.id = "_" + Common.random(5);
        }
        this.initColDefaultOpt(col);
    },

    initColDefaultOpt(col) {
        if (col._isMultiLevelGroup) {
            return;
        }
        let colDefaults = this.opt.colDefaults;
        for (let k in colDefaults) {
            if (typeof(col[k]) === "undefined") {
                col[k] = colDefaults[k];
            }
        }
    },

    initColWidth(col) {
        if (col._isMultiLevelGroup) {
            return;
        }
        if (col.id === this._spaceCol.id) {
            col.width = 1;
            this._definedWidth += 1;
            return;
        }
        if (Common.isNumber(col.width) && !col._isAutoWidth) {
            this._definedWidth += col.width;
            col.minWidth = Math.min(col.minWidth, col.width);
            col.maxWidth = Math.max(col.maxWidth, col.width);
            return;
        }

        this._autoWidthCols.push(col);
        col._isAutoWidth = true;
    },

    initAutoWidthColsWidth() {
        let containerWidth = this.container.width();
        let totalAutoWidth = containerWidth - this._definedWidth;
        let autoColsLen = this._autoWidthCols.length;
        let autoColWidth = 1;
        let modWidth = 0;
        if (autoColsLen > 0) {
            autoColWidth = parseInt(totalAutoWidth / autoColsLen, 10);
            modWidth = totalAutoWidth - (autoColWidth * autoColsLen)
        }
        this._autoWidthCols.forEach((col, index) => {
            let width = autoColWidth;
            let dis = 0;
            if (Common.isNumber(col.minWidth)) {
                dis = col.minWidth - width
                if (dis > 0) {
                    col.width = col.minWidth
                    totalAutoWidth = totalAutoWidth - col.minWidth
                    autoColsLen--
                }
            }
        });
        if (autoColsLen > 0) {
            autoColWidth = parseInt(totalAutoWidth / autoColsLen, 10);
            modWidth = totalAutoWidth - (autoColWidth * autoColsLen)
        }
        this._autoWidthCols.forEach((col, index) => {
            let width = autoColWidth;
            width = Common.maxmin(width, col.minWidth, col.maxWidth);
            if (index === 0) {
                width += modWidth
            }
            col.width = width;
        });
    },

    initColFatByType(col, name, type) {
        let fat;
        if (typeof(col[name]) === "function") {
            fat = col[name];
        } else {
            fat = this.getFat(type);
        }
        if (!fat) {
            fat = this.fats.string;
        }
        col["_" + name] = fat.bind(this);
        return this;
    },

    setColWidth(colIndex, width, keepRange, resize) {
        let col = this.getCol(colIndex);
        if (!col) {
            return this;
        }
        if (!Common.isNumber(width)) {
            return this;
        }
        width = Math.max(0, width);
        width = Math.round(width);

        if (!keepRange) {
            col.minWidth = Math.min(col.minWidth, width);
            col.maxWidth = Math.max(col.maxWidth, width);
        }
        this.table.setColWidth(col, width);
        if (resize) {
            this.resize();
        }
        return this;
    },
    showCol(colIndex, newWidth, resize) {
        let colItem = this.getCol(colIndex);
        if (!colItem) {
            return this;
        }
        let $el = this.getHeaderEl(colItem);
        let elWidth = $el.width();
        let width = colItem.originalWidth || colItem.width || elWidth;
        if (Common.isNumber(newWidth)) {
            width = newWidth;
            colItem.originalWidth = newWidth;
        }
        this.setColWidth(colItem._index, width, resize);
        return this;
    },
    hideCol(colIndex, resize) {
        let colItem = this.getCol(colIndex);
        if (!colItem) {
            return this;
        }
        let $el = this.getHeaderEl(colItem);
        let elWidth = $el.width();
        if (!Common.isNumber(colItem.originalWidth)) {
            colItem.originalWidth = colItem.width || elWidth;
        }
        this.setColWidth(colItem._index, 0, resize);
        return this;
    },
    showCols(cols, newWidth, resize) {
        if (!Common.isArray(cols)) {
            return this;
        }
        for (let i = 0, l = cols.length; i < l; i++) {
            this.showCol(cols[i], newWidth);
        }
        if (resize) {
            this.resize();
        }
        return this;
    },
    hideCols(cols, resize) {
        if (!Common.isArray(cols)) {
            return this;
        }
        for (let i = 0, l = cols.length; i < l; i++) {
            this.hideCol(cols[i]);
        }
        if (resize) {
            this.resize();
        }
        return this;
    },
    getColType(col) {
        if (!col) {
            return "";
        }
        let type = col.dataType;
        if (!type && typeof(col.fat) === "string") {
            type = col.fat;
        }
        return type;
    },
    getColFat(col) {
        if (!col) {
            return "";
        }
        let fat = col.fat;
        if (!fat && col.dataType) {
            fat = col.dataType;
        }
        return fat;
    },

    getHeaderEl(colIndex) {
        let colItem = this.getCol(colIndex);
        let $el = this.table.getHeaderEl(colItem);
        return $el;
    },



    //row
    initTableRowsData() {
        this.handleRowFilter();
        this.handleSort();
        this.handleRowNumber();
        this.tableRows.length = 0;
        let self = this;
        let rows = this.getRows();
        let _doSetTableRows = function(rows, parent) {
            if (!Common.isArray(rows)) {
                return;
            }
            let list_length = rows.length;
            let list_index = 0;
            rows.forEach(function(row) {
                if (row._invisible) {
                    return;
                }
                row._listLength = list_length;
                row._listIndex = list_index;
                list_index++;
                self.tableRows.push(row);
                if (row._isMultiLevelGroup && row._collapsed) {
                    return;
                }
                _doSetTableRows(row.childs, row);
            });
        };
        _doSetTableRows(rows);
        this._addIndexAttrToColsRows(this.tableRows);
        return this;
    },

    handleRowFilter() {
        let rowFilter = this.opt.rowFilter;
        if (typeof(rowFilter) !== "function") {
            rowFilter = function(rowItem) {
                return true;
            };
        }
        this.eachRow(function(row, i, parent) {
            let invisible = false;
            if (typeof(row.invisible) === "boolean") {
                invisible = row.invisible;
            } else {
                let visible = rowFilter.call(this, row);
                invisible = !visible;
            }
            row._invisible = invisible;
            if (!invisible) {
                let current = row;
                while (current._parent) {
                    current._parent._invisible = false;
                    current = current._parent;
                }
            }

        });
        return this;
    },

    getRowEls(rowIndex) {
        let item = this.getRow(rowIndex);
        if (!item) {
            return null;
        }
        return this.table.getRowEls(item._index);
    },

    getCellEls(rowIndex) {
        let item = this.getRow(rowIndex);
        if (!item) {
            return null;
        }
        return this.table.getCellEls(item._index);
    },

    getCellEl(rowIndex, colIndex) {
        let rowItem = this.getRow(rowIndex);
        if (!rowItem) {
            return null;
        }
        let colItem = this.getCol(colIndex);
        if (!colItem) {
            return null;
        }
        return this.table.getCellEl(rowItem._index, colItem._index);
    },


    initCollapse() {
        let collapseTotal = this.opt.collapseTotal;
        if (collapseTotal === true) {
            this.setRowsCollapse(true);
            return;
        }
        if (collapseTotal === false) {
            this.setRowsCollapse(false);
            return;
        }
    },

    initCollapseTotal(e, d) {
        let colData = this.getColBy({
            fat: "multiLevel"
        });

        if (!colData) {
            return;
        }

        let width = this.getCollapseWidth();

        let $el = this.getHeaderEl(colData);
        $el.find(".vt-col-content").css({
            "margin-left": width + "px"
        });
        let $headerExpandCollapseTotal = $el.find(".vt-header-expand-collapse-total");
        if (!$headerExpandCollapseTotal.length) {
            $headerExpandCollapseTotal = $("<div/>").addClass("vt-header-expand-collapse-total").appendTo($el);
        }
        $headerExpandCollapseTotal.width(width);
        $headerExpandCollapseTotal.empty();
        this.updateCollapseIcon(colData, $headerExpandCollapseTotal);

    },

    getCollapseWidth() {
        let enRowNumber = this.opt.enRowNumber;
        let rowNumberWidth = this.opt.rowNumberWidth;
        let isMultiLevel = this.opt.rowsInfo.isMultiLevel;

        let leftWidth = 15;
        let spaceWidth = 5;
        let numberWidth = rowNumberWidth + spaceWidth;
        let width = 0;
        if (isMultiLevel) {
            width = leftWidth + Math.max(0, numberWidth - leftWidth);
        } else if (enRowNumber) {
            width = numberWidth;
        }
        return width;
    },

    updateCollapseIcon(colData, $headerExpandCollapseTotal) {
        let isMultiLevel = this.opt.rowsInfo.isMultiLevel;
        let enCollapseTotal = this.opt.enCollapseTotal;
        if (!isMultiLevel || !enCollapseTotal) {
            return;
        }
        this.enCollapseTotal(colData, $headerExpandCollapseTotal)
    },

    enCollapseTotal(colData, $headerExpandCollapseTotal) {
        let $iconElem = $('<div/>').addClass("vt-icons vt-multiLevel-icon vt-expand-collapse-total-icon").appendTo($headerExpandCollapseTotal);
        this.setElMultiLevelIcon($iconElem, this.opt.collapseTotal);
    },

    expandTotal(targetLevel) {
        this.opt.collapseTotal = false;
        this.setRowsCollapse(false, targetLevel);
        this.setCollapseTotalIcon();
        this.table.removeAll();
        this.render();
    },

    collapseTotal() {
        this.opt.collapseTotal = true;
        this.setRowsCollapse(true);
        this.setCollapseTotalIcon();
        this.table.removeAll();
        this.render();
    },

    toggleAll() {
        if (this.opt.collapseTotal) {
            this.expandTotal();
        } else {
            this.collapseTotal();
        }
    },

    setRowsCollapse(collapsed, targetLevel) {
        let currentLevel = 1;
        let targetLevelIsNumber = Common.isNumber(targetLevel);
        let rows = this.getRows();
        let eachRows = function(rows, parent) {
            if (!Common.isArray(rows)) {
                return;
            }
            rows.forEach((row) => {
                if (row.childs) {
                    currentLevel++
                    row._collapsed = collapsed;
                    if (targetLevelIsNumber) {
                        if (currentLevel <= targetLevel) {
                            eachRows(row.childs, row);
                        }
                    } else {
                        eachRows(row.childs, row);
                    }

                }
            });
        };
        eachRows(rows);
    },

    setCollapseTotalIcon() {
        if (!this.table.headerRendered) {
            return;
        }
        let $el = this.table.$headerBodys.find(".vt-expand-collapse-total-icon");
        this.setElMultiLevelIcon($el, this.opt.collapseTotal);
    },

    expandItem(rowIndex) {
        let item = this.getRow(rowIndex);
        if (!item) {
            return;
        }
        if (!item.childs) {
            this.trigger("onRowRequestChilds", item);
            return;
        }
        if (!Common.isArray(item.childs)) {
            return;
        }
        item._collapsed = false;
        this.rmRow = item;
        this.handleCollapsedItemStyle(item);
        this.render();
    },

    collapseItem(rowIndex) {
        let item = this.getRow(rowIndex);
        if (!item) {
            return;
        }
        if (!Common.isArray(item.childs)) {
            return;
        }
        item._collapsed = true;
        this.rmRow = item;
        this.handleCollapsedItemStyle(item);
        this.render();
    },

    toggleItem(rowIndex) {
        let item = this.getRow(rowIndex);
        if (!item) {
            return;
        }
        if (item._collapsed) {
            this.expandItem(item._index);
        } else {
            this.collapseItem(item._index);
        }
    },

    handleCollapsedItemStyle(item) {
        if (!this.table.headerRendered) {
            return;
        }
        let rowEls = this.table.getRowEls(item._index);
        if (!rowEls) {
            return;
        }
        let collapsed = item._collapsed;
        if (collapsed) {
            rowEls.removeClass("vt-expanded").addClass("vt-collapsed");
        } else {
            rowEls.removeClass("vt-collapsed").addClass("vt-expanded");
        }
        let $el = rowEls.find(".vt-multiLevel-icon");
        this.setElMultiLevelIcon($el, collapsed);
    },

    setElMultiLevelIcon($el, collapsed) {
        if (!$el) {
            return;
        }
        $el.removeClass("vt-icon-collapsed vt-icon-expanded");
        if (collapsed) {
            $el.addClass("vt-icon-collapsed");
        } else {
            $el.addClass("vt-icon-expanded");
        }
    },

    isEnRowNumber(rowData) {
        if (rowData._invisible) {
            return false;
        }
        if (rowData._fixed) {
            return false;
        }
        if (rowData._rowType === "space") {
            return false;
        }
        if (rowData.enRowNumber === false) {
            return false;
        }
        return true;
    },

    handleEnRowNumber(rowData, listNumber, leafNumber) {
        if (!this.isEnRowNumber(rowData)) {
            return "";
        }
        if (this.opt.rowNumberType === "list") {
            return listNumber;
        }
        return leafNumber;
    },

    handleRowNumber() {
        this.opt.rowNumber = "";
        this.opt.rowNumberWidth = 0;
        let enRowNumber = this.opt.enRowNumber;
        if (!enRowNumber) {
            return this;
        }
        if (typeof(enRowNumber) !== "function") {
            enRowNumber = this.handleEnRowNumber;
        }

        let rows = this.getRows();
        let rowNumber = "";
        let leafNumber = 1;
        let self = this;
        let eachRows = function(rows, parent) {
            if (!Common.isArray(rows)) {
                return;
            }
            let listNumber = 1;
            rows.forEach((rowData) => {
                if (self.isRowGroup(rowData)) {
                    rowData._rowNumber = "";
                    eachRows(rowData.childs, rowData);
                } else {
                    let number = enRowNumber.call(self, rowData, listNumber, leafNumber);
                    rowData._rowNumber = number;
                    if (number) {
                        number += "";
                        if (rowNumber.length <= number.length) {
                            rowNumber = number;
                        }
                        listNumber += 1;
                        leafNumber += 1;
                    }
                }

            });
        };

        eachRows(rows);
        this.opt.rowNumber = rowNumber;
        this.opt.rowNumberWidth = this.table.getTextWidth(rowNumber);
    },

    initSect() {
        let sectAll = this.opt.sectAll;
        if (sectAll === true) {
            this.sectAllToData();
            return;
        }
        if (sectAll === false) {
            this.unsectAllToData();
            return;
        }
    },

    isEnCheckboxTotal() {
        let enCheckbox = this.opt.enCheckbox;
        let enCheckboxTotal = this.opt.enCheckboxTotal;
        if (!enCheckbox || !enCheckboxTotal) {
            return false;
        }
        return true;
    },

    initCheckboxTotal(e, d) {
        if (!this.isEnCheckboxTotal()) {
            return;
        }
        let colData = this._checkboxCol;
        let enCheckboxTotal = this.opt.enCheckboxTotal;
        if (typeof(enCheckboxTotal) !== "function") {
            enCheckboxTotal = this.enCheckboxTotal;
        }
        let $el = this.getHeaderEl(colData);
        let $content = $el.find(".vt-col-content");
        enCheckboxTotal.call(this, colData, $content);
    },

    enCheckboxTotal(colData, $el) {
        let $checkboxTotal = $("<div/>").addClass("vt-icons vt-checkbox vt-checkbox-total");
        if (this.opt.sectAll) {
            $checkboxTotal.addClass("vt-_sect");
        }
        $el.empty().append($checkboxTotal);
    },

    updateCheckboxTotal(sectAll) {
        if (!this.isEnCheckboxTotal()) {
            return;
        }
        let colData = this._checkboxCol;
        let $el = this.getHeaderEl(colData);
        let $checkboxTotal = $el.find(".vt-checkbox-total");
        if (!$checkboxTotal.length) {
            return;
        }
        $checkboxTotal.removeClass("vt-mixed");
        $checkboxTotal.removeClass("vt-_sect");
        if (sectAll === false) {
            return;
        }
        if (sectAll === true) {
            $checkboxTotal.addClass("vt-_sect");
            return;
        }
        $checkboxTotal.addClass("vt-mixed");
    },

    updateSectAll(sectLength, sectAll) {
        let sectChanged = false;
        if (sectAll !== this._instanceCacheInfo.sectAll) {
            this._instanceCacheInfo.sectAll = sectAll;
            this.updateCheckboxTotal(sectAll);
            sectChanged = true;
        }

        if (sectLength !== this._instanceCacheInfo.sectLength) {
            this._instanceCacheInfo.sectLength = sectLength;
            sectChanged = true;
        }

        if (!sectChanged) {
            return this;
        }

        this.trigger("onSectChanged", {
            sectLength: sectLength,
            totalSectable: this.totalSectable,
            sectAll: sectAll
        });

        return this;
    },

    sectAll() {
        this.sectAllToData();
        this.updateSectableRowsStatus();
        this.updateSectAll(this.totalSectable, true);
        return this;
    },

    sectAllToData() {
        this.g_sect_order = 0;
        let self = this;
        this.eachSectableRows(function(row, i, parent) {
            row._sect = true;
            row._sectOrder = self.g_sect_order++;
        });
        return this;
    },

    unsectAll() {
        this.unsectAllToData();
        this.updateSectableRowsStatus();
        this.updateSectAll(0, false);
        return this;
    },

    unsectAllToData() {
        this.eachSectableRows(function(row, i, parent) {
            row._sect = false;
        });
        return this;
    },

    updateSectableRowsStatus() {
        let viewArea = this.getViewArea();
        let rowsIndexs = viewArea.rowsIndexs;
        let self = this;
        rowsIndexs.forEach(function(rowIndex) {
            let rowItem = self.getRow(rowIndex);
            if (self.isRowSectable(rowItem)) {
                self.updateRowSect(rowItem);
            }
        });
        return this;
    },

    g_sect_order: 0,

    addRowSect(rowItem) {
        if (!rowItem) {
            return this;
        }
        this.addRowStatus(rowItem, "_sect");
        rowItem._sectOrder = this.g_sect_order++;

        this.updateRowCheckbox(rowItem);
        return this;
    },

    removeRowSect(rowItem) {
        if (!rowItem) {
            return this;
        }
        this.removeRowStatus(rowItem, "_sect");
        this.updateRowCheckbox(rowItem);
        return this;
    },

    updateRowSect(rowItem) {
        if (!rowItem) {
            return this;
        }
        this.updateRowStatus(rowItem, "_sect");
        this.updateRowCheckbox(rowItem);
        return this;
    },

    updateRowCheckbox(rowItem) {
        let enCheckbox = this.opt.enCheckbox;
        if (!enCheckbox) {
            return this;
        }
        this.updateCell(rowItem._index, this._checkboxCol._index);
        this.updateSectStatus();

    },

    updateSectStatus() {
        let self = this;
        clearTimeout(this.timeout_updateSectStatus);
        this.timeout_updateSectStatus = setTimeout(function() {
            let sectRows = self.getSectRows();
            let sectLength = sectRows.length;
            let sectAll = null;
            if (sectLength === 0) {
                sectAll = false;
            } else if (sectLength === self.totalSectable) {
                sectAll = true;
            }
            self.updateSectAll(sectLength, sectAll);
        }, 100);

    },

    handleMultiSect(item, e) {
        if (item._sect) {
            this.unsetSectRow(item._index);
            return;
        }
        this.addRowSect(item);
    },

    handleSingleSect(item, e) {
        this.unsetAllSectRows();
        this.addRowSect(item);
    },

    unsetSectRow(rowIndex) {
        if (arguments.length) {
            let item = this.getRow(rowIndex);
            if (item) {
                this.removeRowSect(item);
            }
            return;
        }
        this.unsetAllSectRows();
    },

    unsetAllSectRows() {
        let self = this;
        this.eachSectableRows(function(row, i, parent) {
            if (row._sect) {
                self.removeRowSect(row);
            }
        });
    },

    setSectRow(rowIndex, e) {
        let item = this.getRow(rowIndex);
        if (!item) {
            return;
        }
        if (this.opt.multiSect) {
            this.handleMultiSect(item, e);
            return;
        }
        this.handleSingleSect(item);

    },

    getSectRow() {
        let sectRow = null;
        let sectRows = this.getSectRows();
        if (sectRows.length) {
            sectRow = sectRows[0];
        }
        return sectRow;
    },

    getSectRows() {
        let sectRows = [];
        this.eachSectableRows(function(row, i, parent) {
            if (row._sect) {
                sectRows.push(row);
            }
        });
        if (sectRows.length > 1) {
            sectRows.sort(function(a, b) {
                let a_order = a._sectOrder;
                let b_order = b._sectOrder;
                if (a_order > b_order) {
                    return 1;
                }
                if (a_order < b_order) {
                    return -1;
                }
                return 0;
            });
        }
        return sectRows;
    },

    eachSectableRows(callback) {
        if (typeof(callback) !== "function") {
            return this;
        }
        let total = 0;
        let self = this;
        this.eachRow(function(item, i, parent) {
            if (self.isRowSectable(item)) {
                callback.call(this, item, i, parent);
                total += 1;
            }
        });
        this.totalSectable = total;
        return this;
    },

    addRowStatus(rowItem, status) {
        if (!rowItem) {
            return;
        }
        rowItem[status] = true;
        this.updateRowStatus(rowItem, status);
    },

    removeRowStatus(rowItem, status) {
        if (!rowItem) {
            return;
        }
        rowItem[status] = false;
        this.updateRowStatus(rowItem, status);
    },
    updateRowStatus(rowItem, status) {
        if (!this.table.headerRendered) {
            return;
        }
        let rowEls = this.table.getRowEls(rowItem._index);
        if (rowEls) {
            let hasStatus = rowItem[status];
            let className = "vt-" + status;
            if (hasStatus) {
                rowEls.addClass(className);
            } else {
                rowEls.removeClass(className);
            }
        }
    },

    //sort
    initSort() {
        let opt = this.opt;
        let optSortId = opt.sortId;
        if (!optSortId) {
            return this;
        }

        let primarySortId = optSortId;
        if (Common.isArray(optSortId)) {
            primarySortId = optSortId[0];
        }

        let sortCol = this.getSortCol(primarySortId);
        if (!sortCol) {
            return this;
        }
        sortCol.sortAsc = opt.sortAsc;
        this.sortCol = sortCol;
        return this;
    },
    setSortCol(sortCol) {
        this.sortCol = sortCol;

        if (!this.table.headerRendered) {
            return;
        }

        this.table.setSortCol(this.sortCol);

        let fixedRows = this.opt.fixedRows;
        let rowsLength = this.table.rows.length;
        if (rowsLength - fixedRows < 2) {
            return;
        }

        if (this.table.hasFixedRows) {
            this.table.removeRowsFrom(fixedRows);
        } else {
            this.table.removeAll();
        }

        this.render();
    },

    getSortCol(id) {
        let sortCol = Common.getListItem(this.tableCols, {
            id: id
        });
        return sortCol;
    },

    getSortComparers() {
        return Common.merge(Compares, this.opt.sortComparers);
    },

    handleSort() {
        this.sortRowData();
        this.table.setSortCol(this.sortCol);

    },

    sortRowData(exportSort) {
        let sortCol = this.sortCol;
        if (!sortCol) {
            return;
        }
        let sortType = this.getColType(sortCol);
        let sortId = sortCol.id;
        let sortAsc = sortCol.sortAsc;
        let sortComparers = this.getSortComparers();

        let sortFast = false;
        if (this.opt.sortFast) {
            sortFast = this.sortId === sortId ? true : false;
        }

        let sortOpt = {
            sortType: sortType,
            sortId: sortId,
            sortAsc: sortAsc,
            sortComparers: sortComparers,
            sortFast: sortFast,
            sortFastAsc: this.sortAsc,
            blankToBottom:this.opt.blankToBottom
        };

        this.sortId = sortId;
        this.sortAsc = sortAsc;
        this.sortComparers = sortComparers;

        let hasSorted = false;
        let _sortHandler = new SortHandler(sortOpt);
        let sortAll = function(rows, parent) {
            if (!Common.isArray(rows)) {
                return;
            }
            if (rows.length > 1) {
                hasSorted = _sortHandler.sortRows(rows);
            }
            rows.forEach(function(row) {
                if (!row) {
                    return;
                }
                sortAll(row.childs, row);
            });
        };

        let rows = this.getRows();
        sortAll(rows);
        if (!exportSort && hasSorted) {
            this.table.removeAll();
        }
    },

    getMultiLevelInfo(multiLevelList, fixedIndex) {
        let level = 0;
        let index = 0;

        let _setItemInfo = function(item, parent) {
            item._fixed = false;
            if (fixedIndex > -1 && index <= fixedIndex) {
                item._fixed = true;
            }
            item._isMultiLevelGroup = false;
            item._childsLength = 0;
            if (item.childs) {
                item._isMultiLevelGroup = true;
                item._childsLength = item.childs.length;
            }
            item._parent = parent;
            let _groupLevel = 0;
            if (parent) {
                _groupLevel = parent._groupLevel + 1;
                if (_groupLevel > level) {
                    level = _groupLevel;
                }
            }
            item._groupLevel = _groupLevel;

            index += 1;
        };


        let _eachMultiLevelList = function(lists, parent) {
            lists.forEach((item) => {
                _setItemInfo(item, parent);
                if (item.childs && item.childs instanceof Array) {
                    _eachMultiLevelList(item.childs, item);
                }
            });
        };
        _eachMultiLevelList(multiLevelList);



        let isMultiLevel = false;
        let i = 0;
        let l = multiLevelList.length;
        while (i < l) {
            let item = multiLevelList[i];
            if (item._isMultiLevelGroup || item._rowType === "group") {
                isMultiLevel = true;
                break;
            }
            i++;
        }
        let multiLevelInfo = {
            isMultiLevel: isMultiLevel,
            maxLevel: level,
            maxIndex: index
        };
        return multiLevelInfo;
    },

    eachMultiLevel(multiLevel, callback) {
        if (typeof(callback) !== "function") {
            return this;
        }
        let eachLevel = function(multiLevel, parent) {
            if (!Common.isArray(multiLevel)) {
                return;
            }
            for (let i = 0, l = multiLevel.length; i < l; i++) {
                let item = multiLevel[i];
                let result = callback.call(this, item, i, parent);
                if (result === false) {
                    return false;
                }
                let subResult = eachLevel(item.childs, item);
                if (subResult === false) {
                    return false;
                }
            }
        };
        eachLevel(multiLevel);
        return this;
    },

    eachRow(callback) {
        let rows = this.getRows();
        this.eachMultiLevel(rows, callback);
        return this;
    },

    eachCol(callback) {
        let cols = this.getCols();
        this.eachMultiLevel(cols, callback);
        return this;
    },

    isRowFixed(rowData) {
        if (!rowData) {
            return false;
        }
        let fixed = rowData._fixed ? true : false;
        return fixed;
    },

    isRowGroup(rowData) {
        if (!rowData) {
            return false;
        }
        if (rowData._isMultiLevelGroup || rowData._rowType === "group") {
            return true;
        }
        return false;
    },

    isRowEmptyGroup(rowData) {
        if (this.isRowGroup(rowData)) {
            if (rowData.childs && rowData._childsLength === 0) {
                return true;
            }
        }
        return false;
    },

    isRowLeaf(rowData) {
        if (!rowData) {
            return false;
        }
        if (rowData._rowType === "space") {
            return false;
        }
        if (this.isRowFixed(rowData) || this.isRowGroup(rowData)) {
            return false;
        }
        return true;
    },

    isRowSectable(rowData) {
        if (!rowData) {
            return false;
        }
        if (rowData.hasOwnProperty("sectable")) {
            let sectable = rowData.sectable ? true : false;
            return sectable;
        }
        return this.isRowLeaf(rowData);
    },

    isCellEditable(rowIndex, colIndex) {
        let rowData = this.getRow(rowIndex);
        if (!rowData) {
            return false;
        }
        let colData = this.getCol(colIndex);
        if (!colData) {
            return false;
        }
        return this.table.isCellEditable(rowData._index, colData._index);
    },

    updateRow(rowIndex) {
        let item = this.getRow(rowIndex);
        if (!item) {
            return this;
        }
        this.table.updateRow(item._index);
        return this;
    },

    updateCell(rowIndex, colIndex) {
        let rowItem = this.getRow(rowIndex);
        if (!rowItem) {
            return this;
        }
        let colItem = this.getCol(colIndex);
        if (!colItem) {
            return this;
        }
        this.table.updateCell(rowItem._index, colItem._index);
        return this;
    },

    getCheckboxContent(rowData) {
        let height = this.opt.lineHeight;
        let _sect = rowData._sect;
        let htmlList = [];
        htmlList.push('<div class="vt-icons  vt-checkbox');
        if (_sect) {
            htmlList.push(' vt-_sect');
        }
        htmlList.push('">');
        htmlList.push('</div>');

        let content = htmlList.join("");
        return content;
    },

    getMultiLevelContent(rowData, fatValue) {
        let template = this.getMultiLevelItemTemplate(rowData);
        let content = Common.replace(template, {
            value: fatValue,
            rowNumber: rowData._rowNumber
        });
        return content;
    },

    getMultiLevelItemTemplate(rowData) {
        let o = this.opt;
        let enRowNumber = o.enRowNumber;
        let rowNumberWidth = o.rowNumberWidth;
        let isMultiLevel = o.rowsInfo.isMultiLevel;
        let isGroup = this.isRowGroup(rowData);
        let isEmptyGroup = this.isRowEmptyGroup(rowData);
        let isCollapsed = rowData._collapsed;
        let rowLevel = Common.toNumber(rowData._groupLevel);
        let template = this.generateMultiLevelItemTemplate(
            enRowNumber,
            rowNumberWidth,
            isMultiLevel,
            isGroup,
            isEmptyGroup,
            isCollapsed,
            rowLevel
        );
        return template;
    },

    generateMultiLevelItemTemplate(
        enRowNumber,
        rowNumberWidth,
        isMultiLevel,
        isGroup,
        isEmptyGroup,
        isCollapsed,
        rowLevel
    ) {
        let leftWidth = 15;
        let spaceWidth = 5;
        let arrowWidth = 4;
        let htmlList = [];


        let paddingLeft = -leftWidth;
        if (isMultiLevel) {
            paddingLeft = 0;
        }
        if (enRowNumber) {
            paddingLeft = Math.max(paddingLeft, rowNumberWidth + spaceWidth - leftWidth);
        }


        let itemStr = "";
        let groupClass = "";
        let iconElem = "";
        if (isGroup) {
            groupClass = " vt-multiLevel-group";
            let iconType = isCollapsed ? "vt-icon-collapsed" : "vt-icon-expanded";
            if (isEmptyGroup) {
                iconType = "";
            }
            iconElem = '<div class="vt-icons vt-multiLevel-icon ' + iconType + '"></div>';
        }
        itemStr += '<div class="vt-multiLevel-item' + groupClass + '" '
        if (paddingLeft < 0) {
            itemStr += 'style="padding-left:' + (leftWidth + paddingLeft) + 'px;"'
        }
        itemStr += '>' + iconElem + '{value}</div>'
        htmlList.push(itemStr);


        while (rowLevel > 0) {
            htmlList.unshift('<div class="vt-multiLevel-level">');
            htmlList.push('</div>');
            rowLevel -= 1;
        }

        if (paddingLeft < 0) {
            paddingLeft = 0;
        }
        htmlList.unshift('<div class="vt-multiLevel" style="padding-left:' + paddingLeft + 'px;">');
        htmlList.push('</div>');

        let handleRowNumber = function() {
            if (!enRowNumber || isGroup) {
                return;
            }
            let rw = rowNumberWidth;
            if (isMultiLevel) {
                rw -= arrowWidth;
                rw = Math.max(rw, 12);
            }
            let rowNumberElem = '<div class="vt-multiLevel-tr-number" style="width:' + rw + 'px;">';
            rowNumberElem += "{rowNumber}";
            rowNumberElem += '</div>';
            htmlList.unshift(rowNumberElem);
        };
        handleRowNumber();

        return htmlList.join("");
    },

    scrollToRow(row) {
        let rowItem = this.getRow(row);
        this.table.scrollToItem(rowItem, null);
        return this;
    },

    scrollToCol(col) {
        let colItem = this.getCol(col);
        this.table.scrollToItem(null, colItem);
        return this;
    },

    scrollToCell(row, col) {
        let rowItem = this.getRow(row);
        let colItem = this.getCol(col);
        this.table.scrollToItem(rowItem, colItem);
        return this;
    },

    scrollRowIntoView(row) {
        let rowItem = this.getRow(row);
        this.table.scrollItemIntoView(rowItem, null);
        return this;
    },

    scrollColIntoView(col) {
        let colItem = this.getCol(col);
        this.table.scrollItemIntoView(null, colItem);
        return this;
    },

    scrollCellIntoView(row, col) {
        let rowItem = this.getRow(row);
        let colItem = this.getCol(col);
        this.table.scrollItemIntoView(rowItem, colItem);
        return this;
    },

    getScrollBarWidth() {
        return this.table.getScrollBarWidth.apply(this.table, arguments);
    },
    getScrollBarHeight() {
        return this.table.getScrollBarHeight.apply(this.table, arguments);
    },

    getScrollViewWidth() {
        return this.table.getScrollViewWidth.apply(this.table, arguments);
    },
    getScrollViewHeight() {
        return this.table.getScrollViewHeight.apply(this.table, arguments);
    },

    getScrollWidth() {
        return this.table.getScrollWidth.apply(this.table, arguments);
    },
    getScrollHeight() {
        return this.table.getScrollHeight.apply(this.table, arguments);
    },

    getViewArea() {
        return this.table.getViewArea.apply(this.table, arguments);
    },

    getExportHeadStr() {
        return this.table.getExportHeadStr.apply(this.table, arguments);
    },

    getExportBodyStr(onlySect, prefix, exportAll, useFat) {
        let rows = this.getRows();
        let _exportTempRows = [];
        let _doGetExportTempRows = function(rows, parent) {
            if (!Common.isArray(rows)) {
                return;
            }
            rows.forEach(function(row) {
                _exportTempRows.push(row);
                _doGetExportTempRows(row.childs, row);
            });
        };
        if(exportAll) {
            this.sortRowData(true)
            _doGetExportTempRows(rows);
            this.table._exportTempRows = _exportTempRows;
        }else {
            this.table._exportTempRows = this.table.rows;
        }
        return this.table.getExportBodyStr.apply(this.table, [onlySect, prefix, useFat]);
    },

    removeRow() {
        return this.table.removeRow.apply(this.table, arguments);
    },
    removeRows() {
        return this.table.removeRows.apply(this.table, arguments);
    },

    removeRowsFrom() {
        return this.table.removeRowsFrom.apply(this.table, arguments);
    },

    removeCol() {
        return this.table.removeCol.apply(this.table, arguments);
    },
    removeCols() {
        return this.table.removeCols.apply(this.table, arguments);
    },

    removeCell() {
        return this.table.removeCell.apply(this.table, arguments);
    },
    removeCells() {
        return this.table.removeCells.apply(this.table, arguments);
    },
    removeAll() {
        return this.table.removeAll.apply(this.table, arguments);
    },

    reset() {
        this.render(true);
        return this;
    },
    update() {
        this.table.removeAll();
        this.render();
        return this;
    },
    resize() {
        if (this.table.headerRendered) {
            this.table.resize();
        }
        return this;
    },
    clean() {
        this._instanceCacheInfo = {}
        this.sortId = null;
        this.sortAsc = null;
        this.sortComparers = null;
        this.sortCol = null;
        this.table.sortCol = null;
        return this;
    },

    destroy() {
        this.clean();
        this.unbind();
        if (this.table) {
            this.table.unbind();
            this.table.destroy();
            this.table = null;
        }
        this.specialCols = null;
        this.tableAllCols = null;
        this.tableCols = null;
        this.tableRows = null;
        this.fats = null;
        this.editors = null;
        this.opt = null;
        this.cols = [];
        this.rows = [];
        return this;
    }
});

export default ViewTable;