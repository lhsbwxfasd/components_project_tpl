let $ = window["jQuery"] || require("jquery")
import "jquery.mousewheel"
import Common from "../../common/index.js"
import templateHtml from "../template/template.html"
import "../scss/view.scss"
let View = Common.property.extend({
    lastRenderTime: 0,
    fixedHeight: 0,
    totalHeight: 0,
    scrollHeight: 0,
    hasHScroll: true,
    hasVScroll: true,
    scrollLeft: 0,
    scrollTop: 0,
    scrollTopOffset: 0,
    _initTemplate() {
        this.$template = $(templateHtml).appendTo(this.$container)
        this.$focusSinkStart = this.find(".vt-focus-start");
        this.$focusSinkEnd = this.find(".vt-focus-end");
        this.$focusSink = $().add(this.$focusSinkStart).add(this.$focusSinkEnd);
        this._cacheHeaderEl()
        this._cacheTableBodyEl()
        this._cacheItemBodyEl()
        return this;
    },
    _cacheHeaderEl() {
        this.$tableHeader = this.find(".vt-table-header")
        this.$tableHeaderL = this.$tableHeader.find(".vt-table-header-left")
        this.$tableHeaderC = this.$tableHeader.find(".vt-table-header-center")
        this.$tableHeaderRt = this.$tableHeader.find(".vt-table-header-right")
        this.$headerBodyL = this.$tableHeaderL.find(".cm-scroll-body")
        this.$headerBodyC = this.$tableHeaderC.find(".cm-scroll-body")
        this.$headerBodyRt = this.$tableHeaderRt.find(".cm-scroll-body")
        this.$headerBodys = $().add(this.$headerBodyL).add(this.$headerBodyC).add(this.$headerBodyRt)
    },
    _cacheTableBodyEl() {
        this.$tableBody = this.find(".vt-table-body")
        this.$itemTopL = this.$tableBody.find(".vt-table-body-top-left")
        this.$itemTopC = this.$tableBody.find(".vt-table-body-top-center")
        this.$itemTopRt = this.$tableBody.find(".vt-table-body-top-right")
        this.$itemBottomL = this.$tableBody.find(".vt-table-body-bottom-left")
        this.$itemBottomC = this.$tableBody.find(".vt-table-body-bottom-center")
        this.$itemBottomRt = this.$tableBody.find(".vt-table-body-bottom-right")
        this.$items = $().add(this.$itemTopL)
            .add(this.$itemTopC)
            .add(this.$itemTopRt)
            .add(this.$itemBottomL)
            .add(this.$itemBottomC)
            .add(this.$itemBottomRt)
    },
    _cacheItemBodyEl() {
        this.$itemBodyTopL = this.$itemTopL.find(".cm-scroll-body")
        this.$itemBodyTopC = this.$itemTopC.find(".cm-scroll-body")
        this.$itemBodyTopRt = this.$itemTopRt.find(".cm-scroll-body")
        this.$itemBodyBottomL = this.$itemBottomL.find(".cm-scroll-body")
        this.$itemBodyBottomC = this.$itemBottomC.find(".cm-scroll-body")
        this.$itemBodyBottomRt = this.$itemBottomRt.find(".cm-scroll-body")
        this.$itemBodys = $().add(this.$itemBodyTopL)
            .add(this.$itemBodyTopC)
            .add(this.$itemBodyTopRt)
            .add(this.$itemBodyBottomL)
            .add(this.$itemBodyBottomC)
            .add(this.$itemBodyBottomRt)
    },
    _setTemplateClass() {
        let o = this.opt;
        this.$template.removeClass();
        this.$template.addClass("vt-view-table");
        let _id = this.$template.attr("_id");
        if (_id) {
            this._removeRowCellStyleSheet(_id);
        }
        this.$template.addClass(this.uid).attr("_id", this.uid);
        if (o.theme) {
            this.$template.addClass("vt-" + o.theme);
        }
        this.$template.addClass(o.cssName);
        this.scrollbarSize = Common.toNumber(o.scrollbarSize);
    },

    constructor(container) {
        this.create(container);
    },
    create(container) {
        if (!container) {
            return this;
        }
        this.uid = "vt-" + Common.uniq(3);
        this.rowsCache = {};
        this.$container = $(container);
        this.$container.empty();
        this._initTemplate();
    },

    init(opt) {
        this._instanceCacheInfo = {};
        this.headerRendered = false;
        this.itemBodyWidthL = 0;
        this.itemBodyWidthC = 0;
        this.itemBodyWidthRt = 0;
        this.itemBodyHeightT = 0;
        this.itemBodyHeightB = 0;
        this.$itemBodys.width(0).height(0);
        this.itemWidthL = 0;
        this.itemWidthC = 0;
        this.itemWidthRt = 0;
        this.itemHeightT = 0;
        this.itemHeightB = 0;
        this.$items.width(0).height(0);
        this.removeAll();
        this.opt = opt;
        this._setTemplateClass();
        this._createRowCellStyleSheet();
        this._initFixedInfo();
        this._createScroll();
        this.bindEvents();
        this.renderCompleted = false;
        this.trigger("onRenderStart", this.renderCompleted);
        this.initHeaders();
        if(this.opt.isExportPdf) {
            this.$template.find('.cm-scroll-body').css("position", 'unset')
          
        }
        return this;
    },

    render() {
        clearTimeout(this.timeout_delay_render);
        if (!this.headerRendered) {
            return;
        }
        let viewArea = this.getViewArea();
        this.viewArea = viewArea;
        this.clearRowCacheByArea(viewArea);
        this.renderRows(viewArea.rowsIndexs);
        this.renderCells(viewArea.rowsIndexs, viewArea.colsIndexs);
        this.trigger("onRenderUpdate", viewArea);
        if (!this.renderCompleted) {
            this.renderCompleted = true;
            this.trigger("onRenderComplete", this.renderCompleted);
        }
        /*cache the last render time*/
        this.lastRenderTime = new Date().getTime();
    },
    delayRender() {
        clearTimeout(this.timeout_delay_render);
        this.timeout_delay_render = setTimeout(() => {
            this.render();
        }, 20);
    },

    //rows
    setRows(rows) {
        if (!Common.isArray(rows)) {
            rows = [];
        }
        this.rows = rows;
        return this;
    },

    getRowsLength() {
        return this.rows.length;
    },

    getRow(rowIndex) {
        let rowData = this.rows[rowIndex];
        return rowData;
    },

    getCellValue(rowItem, colItem) {
        return rowItem[colItem.id];
    },

    isFixedRow(rowIndex) {
        if (this.hasFixedRows && rowIndex <= this.opt.fixedRow) {
            return true;
        }
        return false;
    },

    createRowCache(rowIndex) {
        let rowCache = {
            rowEls: null,
            cellEls: []
        };
        this.rowsCache[rowIndex] = rowCache;
        return rowCache;
    },

    getRowCache(rowIndex) {
        let rowsCache = this.rowsCache[rowIndex];
        return rowsCache;
    },

    getPrepareRenderRowsIndexs(rowsIndexs) {
        let indexs = [];
        if (!rowsIndexs.length) {
            return indexs;
        }
        for (let i = 0, l = rowsIndexs.length; i < l; i++) {
            let rowIndex = rowsIndexs[i];
            if (this.getRowCache(rowIndex)) {
                continue;
            }
            this.createRowCache(rowIndex);
            indexs.push(rowIndex);
        }
        return indexs;
    },

    renderRows(rowsIndexs) {
        let prepareRowsIndexs = this.getPrepareRenderRowsIndexs(rowsIndexs);
        if (!prepareRowsIndexs.length) {
            return;
        }
        let self = this;
        prepareRowsIndexs.forEach(function(rowIndex) {
            self.createRowEl(rowIndex);
        });
    },

    createTrEl(rowData, rowClass, rowTop) {
        let tr = document.createElement("tr");
        tr.className = rowClass;
        tr.style.top = rowTop + "px";
        tr.setAttribute("idx", rowData._index);
        return tr;
    },

    createRowEl(rowIndex) {
        let rowData = this.getRow(rowIndex);
        if (!rowData) {
            return;
        }
        let rowEls = $();
        let vPosType = this.getRowVPosType(rowIndex); /*top or bottom*/
        let rowClass = this.getRowClass(rowData);
        let rowTop = this.getRowPosTopNum(rowIndex);
        let trL = this.createTrEl(rowData, rowClass, rowTop);
        let $itemBodyL = this.getRowItemBody(vPosType, "left");
        let $tbodyL = $itemBodyL.find("tbody")
        $tbodyL.append(trL);
        rowEls = rowEls.add(trL);
        if (this.hasFixedCols) {
            let trC = this.createTrEl(rowData, rowClass, rowTop);
            let $itemBodyC = this.getRowItemBody(vPosType, "center");
            let $tbodyC = $itemBodyC.find("tbody")
            $tbodyC.append(trC);
            rowEls = rowEls.add(trC);

            if (this.hasFixedRightCols) {
                let trRt = this.createTrEl(rowData, rowClass, rowTop);
                let $itemBodyRt = this.getRowItemBody(vPosType, "right");
                let $tbodyRt = $itemBodyRt.find("tbody")
                $tbodyRt.append(trRt);
                rowEls = rowEls.add(trRt);
            }

        }
        let rowCache = this.getRowCache(rowIndex);
        if (rowCache) {
            rowCache.rowEls = rowEls;
        }

    },

    getRowClass(rowData) {
        let rowIndex = rowData._index;
        let rowCss = ["vt-tr"];
        rowCss.push("vt-glv-" + rowData._groupLevel);
        rowCss.push(rowIndex % 2 === 1 ? "vt-odd-tr" : "vt-even-tr");
        if (rowIndex === this.opt.fixedRow + 1) {
            rowCss.push("vt-table-first");
        } else if (rowIndex === this.rows.length - 1) {
            rowCss.push("vt-table-last");
        }
        if (rowData._listIndex === 0) {
            rowCss.push("vt-table-first-tr");
        } else if (rowData._listIndex === rowData._listLength - 1) {
            rowCss.push("vt-table-last-tr");
        }
        if (rowData._isMultiLevelGroup || rowData._rowType === "group") {
            rowCss.push("vt-group");

            if (rowData._collapsed || !rowData._childsLength) {
                rowCss.push("vt-collapsed");
            } else {
                rowCss.push("vt-expanded");
            }

        }
        if (rowData._rowType) {
            rowCss.push("vt-" + rowData._rowType);
        }
        if (rowData.rowClass) {
            rowCss.push(rowData.rowClass);
        }
        let rowStatus = [
            "_sect"
        ];
        rowStatus.forEach(function(status) {
            if (rowData[status]) {
                rowCss.push("vt-" + status);
            }
        });
        let rowClass = rowCss.join(" ");
        return rowClass;
    },

    getRowPosTopNum(rowIndex) {
        let opt = this.opt;
        let top = opt.lineHeight * rowIndex;
        top -= this.scrollTopOffset;
        if (this.hasFixedRows && rowIndex > opt.fixedRow) {
            top -= this.fixedHeight;
        }
        return top;
    },

    getRowVPosType(rowIndex) {
        let opt = this.opt;
        let vPos = "top";
        if (this.hasFixedRows) {
            if (rowIndex <= opt.fixedRow) {
                if (opt.fixedBottom) {
                    vPos = "bottom";
                }
            } else {
                if (!opt.fixedBottom) {
                    vPos = "bottom";
                }
            }
        }
        return vPos;
    },

    getRowItemBody(vPos, hPos) {
        if (vPos === "top") {
            if (hPos === "left") {
                return this.$itemBodyTopL;
            } else if (hPos === "center") {
                return this.$itemBodyTopC;
            } else if (hPos === "right") {
                return this.$itemBodyTopRt;
            }
        } else {
            if (hPos === "left") {
                return this.$itemBodyBottomL;
            } else if (hPos === "center") {
                return this.$itemBodyBottomC;
            } else if (hPos === "right") {
                return this.$itemBodyBottomRt;
            }
        }
    },

    updateRow(rowIndex) {
        let rowCache = this.getRowCache(rowIndex);
        if (!rowCache) {
            return;
        }
        let cellEls = rowCache.cellEls;
        for (let i = 0, l = cellEls.length; i < l; i++) {
            let cellEl = cellEls[i];
            if (cellEl) {
                this.updateCell(rowIndex, i);
            }
        }
    },

    getRowEls(rowIndex) {
        let rowCache = this.getRowCache(rowIndex);
        if (rowCache) {
            return rowCache.rowEls;
        }
        return null;
    },

    getCacheRows() {
        return Object.keys(this.rowsCache);
    },

    getCellEls(rowIndex) {
        let rowCache = this.getRowCache(rowIndex);
        if (rowCache) {
            return rowCache.cellEls;
        }
        return null;
    },

    getCellEl(rowIndex, colIndex) {
        let cellEls = this.getCellEls(rowIndex);
        if (cellEls) {
            return cellEls[colIndex];
        }
        return null;
    },

    removeRowFromCache(rowIndex) {
        let rowEls = this.getRowEls(rowIndex);
        if (rowEls && rowEls.length > 0) {
            for(let i = 0, len = rowEls.length; i < len; i++) {
                this.removeEl(rowEls[i]);
            }
        }
        delete this.rowsCache[rowIndex];
    },

    removeCellFromCache(rowIndex, colIndex) {
        let cellEls = this.getCellEls(rowIndex);
        if (cellEls) {
            this.removeEl(cellEls[colIndex]);
            delete cellEls[colIndex];
        }
    },

    clearRowCacheByArea(viewArea) {
        let rowInfo = viewArea.rowInfo;
        let colInfo = viewArea.colInfo;
        let cacheRows = this.getCacheRows();
        let self = this;
        cacheRows.forEach((rowIndex) => {
            if (rowInfo[rowIndex]) {
                let cellEls = self.getCellEls(rowIndex);
                if (cellEls) {
                    for (let i = 0, l = cellEls.length; i < l; i++) {
                        if (!colInfo[i]) {
                            self.removeEl(cellEls[i]);
                            delete cellEls[i];
                        }
                    }
                }
                return;
            }
            self.removeRowFromCache(rowIndex);
        });
    },

    removeRow(row) {
        this.removeRowFromCache(row);
    },

    removeRows(rows) {
        if (!Common.isArray(rows)) {
            return;
        }
        let self = this;
        rows.forEach(function(row) {
            self.removeRowFromCache(row);
        });
    },

    removeRowsFrom(fromRow) {
        if (!Common.isNumber(fromRow)) {
            return;
        }
        let cacheRows = this.getCacheRows();
        let self = this;
        cacheRows.forEach((row) => {
            if (row >= fromRow) {
                self.removeRowFromCache(row);
            }
        });
    },

    removeAll() {
        this.removeRows(this.getCacheRows());
    },

    getViewArea() {
        this.scrollLeft = this.getScrollLeft();
        this.scrollTop = this.getScrollTop();
        let rowsIndexs = this.getViewAreaRowsIndexs();
        let colsIndexs = this.getViewAreaColsIndexs();
        let rowInfo = {};
        rowsIndexs.forEach(function(index) {
            rowInfo[index] = true;
        });
        let colInfo = {};
        colsIndexs.forEach(function(index) {
            colInfo[index] = true;
        });
        let viewArea = {
            rowsIndexs: rowsIndexs,
            rowInfo: rowInfo,
            colsIndexs: colsIndexs,
            colInfo: colInfo
        };
        return viewArea;
    },

    getViewAreaRowsIndexs() {
        let list = [];
        let distance = 20;
        let lineHeight = this.opt.lineHeight;
        let pageNum = this.opt.pageNum;
        let from = Math.floor((this.scrollTop - distance) / lineHeight);
        from = Math.max(from, 0);
        let till = Math.ceil((this.scrollTop + this.bodyerHeight + distance) / lineHeight);

        if (Common.isNumber(pageNum)) {
            till = Math.max(till, pageNum);
        }

        till = Math.min(till, this.rows.length);
        if (this.hasFixedRows) {
            let fixedRows = this.opt.fixedRows;
            let index = 0;
            while (index < fixedRows) {
                list.push(index);
                index++;
            }
            from += fixedRows;
        }
        if (from < till) {
            for (let i = from; i < till; i++) {
                list.push(i);
            }
        }
        return list;
    },

    //cols and cells
    renderCells(rows, cols) {
        let self = this;
        rows.forEach((rowIndex) => {
            self.createRowCells(rowIndex, cols);
        });
    },
    getPrepareRenderCols(rowIndex, cols) {
        let list = [];
        if (!cols.length) {
            return list;
        }
        for (let i = 0, l = cols.length; i < l; i++) {
            let colIndex = cols[i];
            let cellEl = this.getCellEl(rowIndex, colIndex);
            if (!cellEl) {
                list.push(colIndex);
            }
        }
        return list;
    },

    isFixedCol(colIndex) {
        if (this.hasFixedCols && colIndex <= this.opt.fixedCol) {
            return true;
        }
        return false;
    },

    createRowCells(rowIndex, cols) {
        let prepareCols = this.getPrepareRenderCols(rowIndex, cols);
        if (!prepareCols.length) {
            return;
        }
        let self = this;
        prepareCols.forEach((colIndex) => {
            self.createCellEl(rowIndex, colIndex);
        });
    },

    getCol(colIndex) {
        let colData = this.allCols[colIndex];
        return colData;
    },

    getCellClass(rowData, colData) {
        let rowIndex = rowData._index;
        let colIndex = colData._index;
        let cellCss = ["vt-td"];
        cellCss.push("vt-td-" + colIndex);
        cellCss.push("vt-glv-" + colData._groupLevel);
        if (colData.align) {
            cellCss.push("vt-align-" + colData.align);
        }
        if (colData.cellClass) {
            cellCss.push(colData.cellClass);
        }
        if (colData._listIndex === 0) {
            cellCss.push("vt-table-first-td");
        } else if (colData._listIndex === colData._listLength - 1) {
            cellCss.push("vt-table-last-td");
        }
        let cellClass = cellCss.join(" ");
        return cellClass;
    },

    createTdEl(rowData, colData) {
        let cellClass = this.getCellClass(rowData, colData);
        let td = document.createElement("td");
        td.className = cellClass;
        td.setAttribute("idx", colData._index);
        return td;
    },

    createCellEl(rowIndex, colIndex) {
        let rowCache = this.getRowCache(rowIndex);
        if (!rowCache || !rowCache.rowEls) {
            return;
        }
        let rowData = this.getRow(rowIndex);
        let colData = this.getCol(colIndex);
        if (!rowData || !colData) {
            return;
        }
        let td = this.createTdEl(rowData, colData);
        this.appendCellEl(rowCache, colIndex, td);
        this.handleCellContent(rowData, colData, td);

    },

    appendCellEl(rowCache, colIndex, cellEl) {
        let rowEls = rowCache.rowEls;
        let colsLen = this.cols.length;

        if (this.hasFixedCols) {
            if (colIndex <= this.opt.fixedCol) {
                this.appendEl(rowEls[0], cellEl);
            } else {
                if (this.hasFixedRightCols) {
                    if (colIndex + this.opt.fixedRightCol >= colsLen) {
                        this.appendEl(rowEls[2], cellEl);
                    } else {
                        this.appendEl(rowEls[1], cellEl);
                    }
                } else {
                    this.appendEl(rowEls[1], cellEl);
                }
            }
        } else {
            this.appendEl(rowEls[0], cellEl);
        }

        rowCache.cellEls[colIndex] = cellEl;
    },

    handleCellContent(rowData, colData, cellEl) {
        if (rowData._rowType === "space") {
            return;
        }
        this.handleCellStyle(rowData, colData, cellEl);
        let value = this.getCellValue(rowData, colData);
        let rowIndex = rowData._index;
        let colIndex = colData._index;
        if (typeof(colData._fat) === "function") {
            let content = colData._fat(value, rowData, colData, rowIndex, colIndex, cellEl);
            this.createCellContent(cellEl, content);
            this.trigger("onCellRendered", {
                value: value,
                rowIndex: rowIndex,
                colIndex: colIndex,
                row: rowData,
                col: colData,
                el: cellEl
            });

        }
        if (colData.titleable && typeof(colData._titleFat) === "function") {
            let title = colData._titleFat(value, rowData, colData, rowIndex, colIndex, cellEl);
            if (title) {
                cellEl.setAttribute("title", title);
            }
        }

    },

    handleCellStyle(rowData, colData, cellEl) {
        let supportStyles = this.opt.supportStyles;
        if (!Common.isArray(supportStyles)) {
            return;
        }
        let id = colData.id;
        let cellStyle = cellEl.style;
        supportStyles.forEach((item) => {
            let key = id + "_" + item;
            if (rowData.hasOwnProperty(key)) {
                cellStyle[item] = rowData[key];
            }
        });
        this.initRowHoverCell(rowData, colData, cellStyle);

    },

    createCellContent(cellEl, content) {
        if (typeof(content) === "string") {
            cellEl.innerHTML = content;
        } else {
            cellEl.innerHTML = "";
            $(cellEl).append(content);
        }
    },

    initRowHoverCell(rowData, colData, cellStyle) {
        let keyColor = colData.id + "_backgroundColor";
        let keyHover = keyColor + "_hover";
        let backgroundColor = cellStyle.backgroundColor;
        if (backgroundColor) {
            rowData[keyColor] = backgroundColor;
            rowData[keyHover] = backgroundColor;
        } else if (rowData[keyColor]) {
            delete rowData[keyColor];
            delete rowData[keyHover];
        }
    },

    _onRowHoverCell(rowIndex, hover) {
        let rowItem = this.getRow(rowIndex);
        if (!rowItem) {
            return this;
        }
        let self = this;
        let colsIndexs = this.viewArea.colsIndexs;
        colsIndexs.forEach((colIndex) => {
            let colItem = self.getCol(colIndex);
            let keyColor = colItem.id + "_backgroundColor";
            let keyHover = keyColor + "_hover";
            if (hover) {
                self.setCellBgColor(rowIndex, colIndex, rowItem[keyHover]);
            } else {
                self.setCellBgColor(rowIndex, colIndex, rowItem[keyColor]);
            }
        });
        return this;
    },

    setCellBgColor(rowIndex, colIndex, backgroundColor) {
        if (!backgroundColor) {
            return this;
        }
        let cellEl = this.getCellEl(rowIndex, colIndex);
        if (cellEl) {
            cellEl.style.backgroundColor = backgroundColor;
        }
        return this;
    },

    getPostByEl(el) {
        let $cell = $(el).closest(".vt-td", this.$itemBodys);
        if (!$cell.length) {
            return null;
        }
        let colIndex = this.getElIndex($cell);

        let $row = $cell.closest(".vt-tr", this.$itemBodys);
        if (!$row.length) {
            return null;
        }
        let rowIndex = this.getElIndex($row);

        let post = {
            rowIndex: rowIndex,
            colIndex: colIndex,
            rowEl: $row,
            cellEl: $cell
        };
        return post;
    },

    getPostByEvt(e) {
        if (!e) {
            return null;
        }
        let post = this.getPostByEl(e.target);
        if (post) {
            post.e = e;
        }
        return post;
    },

    updateCell(rowIndex, colIndex) {
        let cellEl = this.getCellEl(rowIndex, colIndex);
        if (!cellEl) {
            return;
        }
        let rowData = this.getRow(rowIndex);
        let colData = this.getCol(colIndex);
        if (this.isCellEditActive(rowIndex, colIndex)) {
            this.currentEditor.updateData(rowData, colData);
        } else {
            this.handleCellContent(rowData, colData, cellEl);
        }
    },

    setCols(cols, allCols) {
        this.cols = cols;
        this.allCols = allCols;
        this.spaceCol = this.getSpaceCol();
        this.headerElCache = {};
        this.colsById = {};
        for (let i = 0, l = allCols.length; i < l; i++) {
            let m = allCols[i];
            this.colsById[m.id] = i;
        }
        return this;
    },

    getColIndex(id) {
        return this.colsById[id];
    },

    getHeaderEl(col) {
        let index = col._index;
        let el = this.headerElCache[index];
        if (!el) {
            el = this.$headerBodys.find(".vt-header-col[idx='" + index + "']");
            this.headerElCache[index] = el;
        }
        return el;
    },

    getSpaceCol() {
        return this.cols[this.cols.length - 1];
    },

    isColSortable(col) {
        if (!col) {
            return false;
        }
        return col.sortable ? true : false;
    },

    isColResizable(col) {
        if (!col) {
            return false;
        }
        //default is true
        if (!col.hasOwnProperty("resizable")) {
            return true;
        }
        return col.resizable ? true : false;
    },

    initHeaders() {
        let self = this;
        let headerL = this.$headerBodyL.get(0);
        let headerC = this.$headerBodyC.get(0);
        let headerRt = this.$headerBodyRt.get(0);
        headerL.innerHTML = "";
        headerC.innerHTML = "";
        headerRt.innerHTML = "";
        headerL.style.visibility = "hidden";
        headerC.style.visibility = "hidden";
        headerRt.style.visibility = "hidden";
        this.renderHeaderCols();
        clearTimeout(this.timeout_initHeaders);
        this.timeout_initHeaders = setTimeout(function() {
            headerL.style.visibility = "";
            headerC.style.visibility = "";
            headerRt.style.visibility = "";
            self.headersCompleteHandler();
        }, 20);
        return this;
    },

    headersCompleteHandler() {
        this.headerRendered = true;
        this.setSortCol(this.sortCol);
        this.setColResizeBar();
        this.resize();
    },

    renderHeaderCols() {
        let opt = this.opt;
        let cols = this.cols;
        let colsLen = cols.length;
        let colsL = [];
        let colsC = [];
        let colsRt = [];
        let fixedCol = opt.fixedCol;
        let fixedRightCol = opt.fixedRightCol;
        for (let i = 0; i < colsLen; i++) {
            let col = cols[i];

            if (this.hasFixedCols && i > fixedCol) {
                if (Common.isNumber(fixedRightCol)) {
                    if (i + fixedRightCol < colsLen) {
                        colsC.push(col);
                    } else {
                        colsRt.push(col);
                    }
                } else {
                    colsC.push(col);
                }
            } else {
                colsL.push(col);
            }
        }
        this._headerTableDatas = [];
        this.createHeaderTable(colsL, this.$headerBodyL);
        this.createHeaderTable(colsC, this.$headerBodyC);
        this.createHeaderTable(colsRt, this.$headerBodyRt);
        this.trigger("onHeaderCreated", {
            el: this.$headerBodys
        });
    },

    updateGroupWidth(group) {
        if (!group || !Common.isArray(group.childs)) {
            return;
        }
        let width = 0;
        let self = this;
        group.childs.forEach(function(item) {
            if (item._isMultiLevelGroup) {
                self.updateGroupWidth(item);
            }
            if (Common.isNumber(item.width)) {
                width += item.width;
            }
        });
        let $el = this.getHeaderEl(group);
        this.setColElWidth($el, width);
        group.width = width;
    },

    updateColGroupWidth(col) {
        if (!col || !col._parent) {
            return;
        }
        let group = col;
        while (group._parent) {
            group = group._parent;
        }
        this.updateGroupWidth(group);
    },

    setSortCol(sortCol) {
        if (!sortCol) {
            return;
        }
        this.sortCol = sortCol;
        let prevSorted = this.$headerBodys.find(".vt-header-col-sorted");
        prevSorted.removeClass("vt-header-col-sorted");
        let sortColElem = this.$headerBodys.find(".vt-header-col[idx='" + sortCol._index + "']");
        sortColElem.addClass("vt-header-col-sorted");
        let sortIcon = sortColElem.find(".vt-sort");
        sortIcon.removeClass("vt-sort-asc");
        sortIcon.removeClass("vt-sort-desc");
        let classSortAsc = sortCol.sortAsc ? "vt-sort-asc" : "vt-sort-desc";
        sortIcon.addClass(classSortAsc);

    },

    setColResizeBar() {
        let cols = this.cols;
        let colEls = this.$headerBodys.find(".vt-col-item");
        colEls.find(".vt-col-resize-bar").remove();
        let self = this;
        let hasResizable = false;
        colEls.each(function() {
            let $elem = $(this);
            let $el = $elem.find(".vt-header-col");
            if (!$el.length) {
                return;
            }
            let index = parseInt($el.attr("idx"), 10);
            let col = cols[index];
            if (self.isColResizable(col)) {
                hasResizable = true;
                $("<div/>").addClass("vt-col-resize-bar").appendTo($elem);
            }
        });
        let $resizeBar = this.$headerBodys.find(".vt-col-resize-bar").unbind();

        if (!hasResizable) {
            return;
        }
        $resizeBar.bind("mousedown", function(e) {
            self.colWidthChange.start({
                e: e,
                target: $(this)
            });
        });
    },

    setColElWidth($el, width) {
        if (!$el || !$el.get(0)) {
            return;
        }
   
        let el = $el.get(0);
        /*td left border 1px so div 'vt-header-col' width = col.width -1*/
        el.style.width = (width - 1) + "px";
        let td = el.parentNode;
        td.style.width = width + "px";
        if (width <= 0) {
            el.style.display = "none";
        } else {
            el.style.display = "";
        }

    },

    setColWidth(colItem, width) {
        let newWidth = Common.maxmin(width, colItem.minWidth, colItem.maxWidth);
        if (colItem.width === newWidth) {
            return;
        }
        colItem.width = newWidth;
        let $el = this.getHeaderEl(colItem);
        this.setColElWidth($el, newWidth);
        this.updateColGroupWidth(colItem);
        this.updateBodySize(true);
        this.trigger("onColWidthChanged", colItem);

    },

    getHeaderTableData(colsList) {
        let tableData = [];
        let maxLevel = this.opt.colsInfo.maxLevel;
        let level = 0;
        while (level <= maxLevel) {
            tableData.push([]);
            level++;
        }

        let addToLevelList = function(col) {
            let levelList = tableData[col._trEl];
            if (levelList) {
                levelList.push(col);
            }
        };

        colsList.forEach(function(col, index) {
            addToLevelList(col);
            if (!col._parent) {
                return;
            }
            let currentItem = col;
            while (currentItem._parent) {
                currentItem = currentItem._parent;
                if (!currentItem._trElMark) {
                    addToLevelList(currentItem);
                    currentItem._trElMark = true;
                }
            }
        });

        return tableData;
    },

    createHeaderColName(col) {
        let value = col.name;
        let content = value;
        if (typeof(col._headerFat) === "function") {
            content = col._headerFat(value, col, col._index);
        }
        content = "<div class='vt-col-name'>" + content + "</div>" + this.getColSortIcon(col);

        let className = "vt-col-content";
        if (col._isMultiLevelGroup) {
            className += " vt-col-group-name";
        }

        if (col.colNameClass) {
            className += " " + col.colNameClass;
        }
        return "<div class='" + className + "'>" + content + "</div>";
    },

    getColSortIcon(col) {
        if (!this.isColSortable(col) || col._isMultiLevelGroup) {
            return "";
        }
        return "<div class='vt-icons vt-sort'></div>";
    },

    getHeaderColClass(col) {
        let headerCss = ["vt-header-col"];
        if (col._isMultiLevelGroup) {
            headerCss.push("vt-header-group");
        } else if (this.isColSortable(col)) {
            headerCss.push("vt-header-sortable");
        }
        if (col.align) {
            headerCss.push("vt-align-" + col.align);
        }
        if (col.colClass) {
            headerCss.push(col.colClass);
        }
        let colClass = headerCss.join(" ");
        return colClass;
    },

    createHeaderCol(col) {
        let name = this.createHeaderColName(col);
        let colClass = this.getHeaderColClass(col);
        /*td left border 1px so div 'vt-header-col' width = col.width -1*/
        let width = col.width - 1;

        let str = "<div class='" + colClass + "' data='" + col.id + "' idx='" + col._index + "' style='width:" + width + "px'";
        if (col.title) {
            str += " title='" + col.title + "'";
        }
        str += ">" + name + "</div>"
        return str;
    },

    createHeaderTd(col) {
        let item = this.createHeaderCol(col);
        let itemClass = "vt-col-item";
        if (col._isMultiLevelGroup) {
            itemClass += " vt-col-group-item";
        }
        if (col.headerItemClass) {
            itemClass += " " + col.headerItemClass;
        }
        let str = "<td class='" + itemClass + "' style='width:" + col.width + "px'";
        let rowspan = col.rowspanNum;
        if (rowspan && rowspan > 1) {
            str += " rowspan='" + rowspan + "'";
        }
        let colspan = col.colspanNum;
        if (colspan && colspan > 1) {
            str += " colspan='" + colspan + "'";
        }
        str += ">" + item + "</td>";
        return str;
    },

    createHeaderTable(colsList, container) {
        let tableData = this.getHeaderTableData(colsList);
        this._headerTableDatas.push(tableData)
        let self = this;
        let trList = [];
        tableData.forEach(function(levelList) {
            if (!levelList.length) {
                return;
            }
            let tdList = [];
            levelList.forEach(function(col) {
                let td = self.createHeaderTd(col);
                tdList.push(td);
            });
            trList.push("<tr>" + tdList.join("") + "</tr>");
        });

        let table = "<table class='vt-header-table' cellpadding='0' cellspacing='0' border='0'>";
        table += "<tbody>" + trList.join("") + "</tbody></table>"
        container.html(table);
    },

    removeCol(col) {
        let cacheRows = this.getCacheRows();
        let self = this;
        cacheRows.forEach((row) => {
            self.removeCellFromCache(row, col);
        });
    },

    removeCols(cols) {
        if (!Common.isArray(cols)) {
            return;
        }
        let cacheRows = this.getCacheRows();
        let self = this;
        cacheRows.forEach((row) => {
            cols.forEach((col) => {
                self.removeCellFromCache(row, col);
            });
        });
    },

    removeCell(row, col) {
        this.removeCellFromCache(row, col);
    },

    removeCells(rows, cols) {
        if (!Common.isArray(rows) || !Common.isArray(cols)) {
            return;
        }
        let self = this;
        rows.forEach(function(row) {
            cols.forEach(function(col) {
                self.removeCellFromCache(row, col);
            });
        });
    },

    getExportHeadStr() {
        let headerTableData = this._headerTableDatas
        let exportHeaderData = []
        let trList = [];

        let tData1 = headerTableData[0]
        let tData2 = headerTableData[1]
        let len = tData1.length
        for (let i = 0; i < len; i++) {
            exportHeaderData.push(tData1[i].concat(tData2[i]))
        }
        this.exportHeaderData = exportHeaderData;

        exportHeaderData.forEach((levelList) => {
            if (!levelList.length) {
                return;
            }
            let tdList = [];
            levelList.forEach((col) => {
                let id = col.id
                if (id !== "vt_checkbox_col" && id !== "vt_space_col") {

                    let tdClass = "";
                    if (col._isMultiLevelGroup) {
                        tdClass += " head_gruop" + " group_level_" + col._groupLevel;
                    }
                    if (col.headerItemClass) {
                        tdClass += " " + col.headerItemClass;
                    }

                    let str = "<td class='" + tdClass + "'";
                    let rowspan = col.rowspanNum;
                    if (rowspan && rowspan > 1) {
                        str += " rowspan='" + rowspan + "'";
                    }
                    let colspan = col.colspanNum;
                    if (colspan && colspan > 1) {
                        str += " colspan='" + colspan + "'";
                    }
                    str += ">" + col.name + "</td>";
                    tdList.push(str);
                }
            });
            trList.push("<tr>" + tdList.join("") + "</tr>");
        });
        return "<thead>" + trList.join("") + "</thead>";
    },

    getExportBodyStr(onlySect, prefix, useFat) {
        let exportCols = [];
        let cols = this.cols;
        let trList = [];
        cols.forEach((col) => {
            let id = col.id
            if (id !== "vt_checkbox_col" && id !== "vt_space_col") {
                exportCols.push(col)
            }
        })

        let _exportTempRows = this._exportTempRows
        _exportTempRows.forEach((row) => {
            if (onlySect && !row._sect) {
                return;
            }
            let tdList = [];
            exportCols.forEach((col) => {
                let text = "--";
                let tdClass = "";
                let cellClass = col.cellClass;
                if(prefix && row[prefix + col.id]) {
                    text = row[prefix + col.id]
                }else if(row[col.id]) {
                    text = row[col.id]
                }
                if(useFat && (typeof(col._fat) === "function")) {
                    text = col._fat(text, row, col);
                    //replace html tag
                    text = text.replace(/<[^>]+>/gi, '')
                }
                if (cellClass) {
                    tdClass += " " + cellClass
                }
                tdList.push("<td class='" + tdClass + "'>" + text + "</td>");
            })

            let trClass = ""
            if (row._isMultiLevelGroup) {
                trClass += " row_group " + " group_level_" + row._groupLevel
            }

            trList.push("<tr class='" + trClass + "'>" + tdList.join("") + "</tr>");
        })
        return "<tbody>" + trList.join("") + "</tbody>";
    },

    getViewAreaColsIndexs() {
        let list = [];
        let distance = 20;
        let from = this.scrollLeft - distance;
        from = Math.max(from, 0);

        let till = this.scrollLeft + this.bodyerWidth + distance;
        till = Math.min(till, this.colsWidth);

        let index = 0;
        if (this.hasFixedCols) {
            let fixedCols = this.opt.fixedCols;
            while (index < fixedCols) {
                list.push(index);
                index++;
            }
            from += this.colsWidthL;
            if (Common.isNumber(this.opt.fixedRightCol)) {
                till += this.colsWidthRt;
            }
        }
        if (from < till) {
            this.getColsIndexsByRange(list, index, from, till);
        }

        return list;
    },

    getColsIndexsByRange(list, index, from, till) {
        let pageNum = this.opt.pageNum;
        let pageNumIsNumber = Common.isNumber(pageNum);
        let fixedRightCol = this.opt.fixedRightCol
        let fixedRightColIsNumber = Common.isNumber(fixedRightCol)

        let cols = this.cols;
        let colsLen = cols.length;
        for (let i = index; i < colsLen; i++) {
            let col = cols[i];
            if (pageNumIsNumber) {
                list.push(i);
            } else {
                if(this.isColInRange(col, from, till) || (fixedRightColIsNumber && ((i + fixedRightCol) >= colsLen))) {
                    list.push(i);
                }
            }
        }
    },
    isColInRange(col, from, till) {
        if (col._hidden) {
            return false;
        }
        let left = col._left;
        let right = left + col.width;
        //out of range
        if (left > till) {
            return false;
        }
        if (right < from) {
            return false;
        }
        //in range
        return true;
    },

    //events
    bindEvents() {
        let self = this;
        this.$headerBodys.unbind().bind("sectstart", function(e) {
            return $(e.target).is("input,textarea");
        });
        this.$items.unbind().bind("sectstart", function(e) {
            return $(e.target).is("input,textarea");
        });
        this.$headerBodys.delegate(".vt-col-item", "contextmenu", function(e) {
            self._onHeaderEvent(e, "onHeaderContextMenu");
        }).delegate(".vt-col-item", "click", function(e) {
            self._onHeaderEvent(e, "onHeaderClick");
        }).delegate(".vt-col-item", "dblclick", function(e) {
            self._onHeaderEvent(e, "onHeaderDblClick");
        }).delegate(".vt-col-item", "mouseover", function(e) {
            self._onHeaderEvent(e, "onHeaderMouseOver");
        }).delegate(".vt-col-item", "mouseout", function(e) {
            self._onHeaderEvent(e, "onHeaderMouseOut");
        }).delegate(".vt-col-item", "mouseenter", function(e) {
            self._onHeaderEvent(e, "onHeaderMouseEnter");
        }).delegate(".vt-col-item", "mouseleave", function(e) {
            self._onHeaderEvent(e, "onHeaderMouseLeave");
        });
        this.scrollLeft = 0;
        this.scrollTop = 0;
        this.$items.bind("mousewheel", function(e) {
            if (self.hasVScroll) {
                self.scroll.handleMousewheel(e);
                self.trigger("onMouseWheel", e);
                if (self._preventDefault_) {
                    e.preventDefault();
                }
            }

        });
        this.scroll.bind("onChange", function(e, d) {
            /*if window.requestAnimationFrame use requestAnimationFrame for delay render, else use custom delay render*/
            if(window.requestAnimationFrame) {
                 window.requestAnimationFrame(function() {
                    self._onScrollChange(e, d)
                });
            }else {

                self._onScrollChange(e, d, true)
            }
        });
        this.$itemBodys.unbind().bind("keydown", function(e) {
            self._onKeyDown(e);
        }).bind("click", function(e) {
            self._onClick(e);
        }).bind("dblclick", function(e) {
            self._onDblClick(e);
        }).bind("contextmenu", function(e) {
            self._onContextMenu(e);
        }).delegate(".vt-td", "mouseover", function(e) {
            self._onCellElHover(e, true);
        }).delegate(".vt-td", "mouseout", function(e) {
            self._onCellElHover(e, false);
        }).delegate(".vt-td", "mouseenter", function(e) {
            self._onCellHover(e, true);
        }).delegate(".vt-td", "mouseleave", function(e) {
            self._onCellHover(e, false);
        }).delegate(".vt-tr", "mouseenter", function(e) {
            self._onRowHover(e, true);
        }).delegate(".vt-tr", "mouseleave", function(e) {
            self._onRowHover(e, false);
        });

        this.$focusSink.unbind().bind("keydown", function(e) {
            self._onKeyDown(e);
        });

        this.colWidthChange = new Common.drag();
        this.colWidthChange.bind("dragstart", function(e, d) {
            self.trigger("startColWidthChange", d);
        }).bind("dragupdate", function(e, d) {
            self.trigger("updateColWidthChange", d);
        }).bind("dragcomplete", function(e, d) {
            self.trigger("doneColWidthChange", d);
        })
    },

    /*editor*/
    getEditor(colIndex) {
        let col = this.cols[colIndex];
        return col._editor;
    },

    setFocus() {
        if (this.tabbingDirection === -1) {
            this.$focusSinkStart.focus();
        } else {
            this.$focusSinkEnd.focus();
        }
    },

    isCellEditActive(rowIndex, colIndex) {
        if (this.currentEditor && this.activeRow === rowIndex && this.activeCol === colIndex) {
            return true;
        }
        return false;
    },

    isCellEditable(rowIndex, colIndex) {

        if (!this.getEditor(colIndex)) {
            return false;
        }

        let rowItem = this.getRow(rowIndex);
        let colItem = this.getCol(colIndex);

        let editable = true;

        //for row 
        if (rowItem.hasOwnProperty("editable")) {
            editable = rowItem.editable;
        }

        //for cell, high priority
        let cell_editable_key = colItem.id + "_editable";
        if (rowItem.hasOwnProperty(cell_editable_key)) {
            editable = rowItem[cell_editable_key];
        }

        return editable ? true : false;
    },

    commitCurrentEdit() {
        if (!this.currentEditor) {
            return false;
        }

        if (this.currentEditor.isValueChanged()) {
            let newValue = this.currentEditor.getValue();
            let validationResults = this.currentEditor.validate(newValue);
            if (validationResults.valid) {

                this.currentEditor.applyValue();
                this.currentEditor.completed = true;

                this.onCellEditValueChangedHandler();
                this.onCellEditCompleteHandler();

                return true;
            } else {

                $(this.activeEl).addClass("vt-invalid");
                this.currentEditor.focus();

                this.onCellEditErrorHandler(validationResults);

                return false;
            }
        }

        this.onCellEditCompleteHandler();

        return true;
    },

    cancelCurrentEdit() {
        this.removeCellEditor();
        return true;
    },

    removeCellEditor() {
        if (!this.currentEditor) {
            return;
        }

        this.onCellEditDestroyHandler();

        this.currentEditor.destroy();
        this.currentEditor = null;

        if (this.activeEl) {
            $(this.activeEl).removeClass("vt-editable").removeClass("vt-invalid");
            this.updateCell(this.activeRow, this.activeCol);
        }

    },

    createCellEditor() {
        if (!this.activeEl) {
            return;
        }

        if (!this.isCellEditable(this.activeRow, this.activeCol)) {
            return;
        }

        //cancel previous editor and removed it
        if (this.currentEditor) {
            this.doCancelCurrentEdit();
            this.removeCellEditor();
        }

        let rowData = this.getRow(this.activeRow);
        let colData = this.getCol(this.activeCol);

        //scroll into view
        this.scrollItemIntoView(rowData, colData);

        let holder = $(this.activeEl);
        holder.addClass("vt-editable").html("");

        //create new editor
        let Editor = this.getEditor(this.activeCol);
        this.currentEditor = new Editor({
            holder: holder,
            rowData: rowData,
            colData: colData
        });

        let self = this;
        this.currentEditor.bind("onCommit", function(e, d) {

            if (self.commitCurrentEdit()) {
                self.setFocus();
            } else {
                self.cancelCurrentEdit();
            }

        }).bind("onChanging", function(e, d) {
            self.onCellEditValueChangingHandler(e, d);
        }).bind("onRendered", function(e, d) {
            self.onCellEditRenderedHandler();
        });

        this.onCellEditStartHandler();

        this.currentEditor.render();

    },

    onCellEditEventHandler(type, info) {
        let eventData = {
            editor: this.currentEditor,
            el: this.activeEl,
            rowIndex: this.activeRow,
            colIndex: this.activeCol,
            rowData: this.currentEditor.rowData,
            colData: this.currentEditor.colData
        };
        if (info) {
            eventData.info = info;
        }
        this.trigger(type, eventData);
    },

    onCellEditStartHandler() {
        this.onCellEditEventHandler("onCellEditStart");
    },

    onCellEditRenderedHandler() {
        this.onCellEditEventHandler("onCellEditRendered");
    },

    onCellEditValueChangingHandler(e, d) {
        this.onCellEditEventHandler("onCellEditValueChanging");
    },

    onCellEditValueChangedHandler() {
        this.onCellEditEventHandler("onCellEditValueChanged");
    },

    onCellEditCompleteHandler() {
        this.onCellEditEventHandler("onCellEditComplete");
        this.removeCellEditor();
    },

    onCellEditErrorHandler(info) {
        this.onCellEditEventHandler("onCellEditError", info);
    },

    onCellEditDestroyHandler() {
        this.onCellEditEventHandler("onCellEditDestroy");
    },

    commitEditAndSetFocus() {
        if (this.commitCurrentEdit()) {
            this.setFocus();
            if (this.opt.autoEdit) {
                this.navigateDown();
            }
        }
    },

    cancelEditAndSetFocus() {
        if (this.cancelCurrentEdit()) {
            this.setFocus();
        }
    },

    doCancelCurrentEdit() {
        if (this.currentEditor) {
            if (this.cancelCurrentEdit()) {
                this.setFocus();
            }
        }
    },

    //by dbl click
    editCellHandler(row, col) {
        if (!this.isCellEditable(row, col)) {
            return;
        }
        if (!this.commitCurrentEdit()) {
            return;
        }
        this.setActiveCell(row, col, true);
        // if no editor was created, set the focus back on the 
        if (!this.currentEditor) {
            this.setFocus();
        }
    },

    editActiveCellEl(forceEdit) {
        let o = this.opt;
        let editable = false;
        if (!forceEdit) {
            editable = (this.activeRow === this.getRowsLength()) || o.autoEdit;
        }
        if (editable && this.isCellEditable(this.activeRow, this.activeCol)) {
            this.createCellEditor();
        }
    },
    /////
    getActiveCell() {
        if (!this.activeEl) {
            return null;
        }

        let active = {
            row: this.activeRow,
            col: this.activeCol
        };

        return active;
    },

    resetActiveCell() {
        this.setActiveCellEl(null);
    },

    setActiveCell(rowIndex, colIndex, forceEdit) {
        let rowData = this.getRow(rowIndex);
        let colData = this.getCol(colIndex);
        if (!rowData || !colData) {
            return;
        }
        this.scrollItemIntoView(rowData, colData);
        let cellEl = this.getCellEl(rowIndex, colIndex);
        this.setActiveCellEl(cellEl, forceEdit);
        let activeCell = this.getActiveCell();
        this.trigger("onActiveCellChanged", activeCell);

    },

    getActiveCellEl() {
        return this.activeEl;
    },

    setActiveCellEl(newActiveEl, forceEdit) {
        //prev active node handler 
        this.previousActiveCellEl();
        //remove active
        if (!newActiveEl) {
            this.activeEl = null;
            this.activeRow = null;
            this.activeCol = null;
            return;
        }
        //change active
        this.activeEl = newActiveEl;
        //current active cell node handler
        this.currentActiveCellEl();
        //edit mode handler
        this.editActiveCellEl(forceEdit);

    },

    previousActiveCellEl() {
        if (!this.activeEl) {
            return;
        }
        //remove edit
        this.removeCellEditor();
        //remove className active
        $(this.activeEl).removeClass("vt-active");
        let rowCache = this.getRowCache(this.activeRow);
        if (rowCache) {
            $(rowCache.rowEls).removeClass("vt-active");
        }
    },

    currentActiveCellEl() {
        if (!this.activeEl) {
            return;
        }
        let pos = this.getPostByEl(this.activeEl);
        this.activeRow = pos.rowIndex;
        this.activeCol = pos.colIndex;
        this.activePosX = pos.colIndex;

        //add className
        $(this.activeEl).addClass("vt-active");
        let rowCache = this.getRowCache(this.activeRow);
        if (rowCache) {
            $(rowCache.rowEls).addClass('vt-active');
        }
    },


    findFirstFocusableCell(row) {
        let cols = this.cols;
        let col = 0;
        while (col < cols.length) {
            if (this.isCellEditable(row, col)) {
                return col;
            }
            col += 1;
        }
        return null;
    },

    findLastFocusableCell(row) {
        let cols = this.cols;
        let col = 0;
        let lastFocusableCell = null;
        while (col < cols.length) {
            if (this.isCellEditable(row, col)) {
                lastFocusableCell = col;
            }
            col += 1;
        }
        return lastFocusableCell;
    },
    ////
    navigatePageDown() {
        this.navigatePage(1);
        this.render();
    },

    navigatePageUp() {
        this.navigatePage(-1);
        this.render();
    },

    navigatePage(dir) {
        let opt = this.opt;
        let numVisibleRows = Math.ceil(this.bodyerHeight / opt.rowHeight);
        let deltaRows = dir * numVisibleRows;
        let pos = Math.floor(this.scrollTop / opt.rowHeight);
        this.setScrollTop((pos + deltaRows) * opt.rowHeight);
        if (this.activeRow != null) {
            let row = this.activeRow + deltaRows;
            let dataLength = this.getRowsLength();
            if (row >= dataLength) {
                row = dataLength - 1;
            }
            if (row < 0) {
                row = 0;
            }

            let col = 0,
                prevCell = null;
            let prevActivePosX = this.activePosX;
            while (col <= this.activePosX) {
                if (this.isCellEditable(row, col)) {
                    prevCell = col;
                }
                col += 1;
            }

            if (prevCell !== null) {
                let cellEl = this.getCellEl(row, prevCell);
                this.setActiveCellEl(cellEl);
                this.activePosX = prevActivePosX;
            } else {
                this.resetActiveCell();
            }
        }
    },

    gotoRight(row, col, posX) {
        let cols = this.cols;
        if (col >= cols.length) {
            return null;
        }

        do {
            col += 1;
        } while (col < cols.length && !this.isCellEditable(row, col));

        if (col < cols.length) {
            return {
                "rowIndex": row,
                "colIndex": col,
                "posX": col
            };
        }
        return null;
    },

    gotoLeft(row, col, posX) {
        if (col <= 0) {
            return null;
        }
        let firstFocusableCell = this.findFirstFocusableCell(row);
        if (firstFocusableCell === null || firstFocusableCell >= col) {
            return null;
        }
        let prev = {
            "rowIndex": row,
            "colIndex": firstFocusableCell,
            "posX": firstFocusableCell
        };
        let pos;
        while (true) {
            pos = this.gotoRight(prev.rowIndex, prev.colIndex, prev.posX);
            if (!pos) {
                return null;
            }
            if (pos.colIndex >= col) {
                return prev;
            }
            prev = pos;
        }
    },

    gotoDown(row, col, posX) {
        let prevCell;
        let dataLength = this.getRowsLength();
        while (true) {
            if (++row >= dataLength) {
                return null;
            }
            prevCell = col = 0;
            while (col <= posX) {
                prevCell = col;
                col += 1;
            }
            if (this.isCellEditable(row, prevCell)) {
                return {
                    "rowIndex": row,
                    "colIndex": prevCell,
                    "posX": posX
                };
            }
        }
    },

    gotoUp(row, col, posX) {
        let prevCell;
        while (true) {
            if (--row < 0) {
                return null;
            }
            prevCell = col = 0;
            while (col <= posX) {
                prevCell = col;
                col += 1;
            }
            if (this.isCellEditable(row, prevCell)) {
                return {
                    "rowIndex": row,
                    "colIndex": prevCell,
                    "posX": posX
                };
            }
        }
    },

    gotoNext(row, col, posX) {
        if (row == null && col == null) {
            row = col = posX = 0;
            if (this.isCellEditable(row, col)) {
                return {
                    "rowIndex": row,
                    "colIndex": col,
                    "posX": col
                };
            }
        }
        let pos = this.gotoRight(row, col, posX);
        if (pos) {
            return pos;
        }

        let firstFocusableCell;
        let dataLength = this.getRowsLength();
        while (++row < dataLength) {
            firstFocusableCell = this.findFirstFocusableCell(row);
            if (firstFocusableCell !== null) {
                return {
                    "rowIndex": row,
                    "colIndex": firstFocusableCell,
                    "posX": firstFocusableCell
                };
            }
        }
        return null;
    },

    gotoPrev(row, col, posX) {

        if (row == null && col == null) {
            row = this.getRowsLength() - 1;
            col = posX = this.cols.length - 1;
            if (this.isCellEditable(row, col)) {
                return {
                    "rowIndex": row,
                    "colIndex": col,
                    "posX": col
                };
            }
        }

        let pos;
        let lastSelectableCell;
        while (!pos) {
            pos = this.gotoLeft(row, col, posX);
            if (pos) {
                break;
            }
            if (--row < 0) {
                return null;
            }

            col = 0;
            lastSelectableCell = this.findLastFocusableCell(row);
            if (lastSelectableCell !== null) {
                pos = {
                    "rowIndex": row,
                    "colIndex": lastSelectableCell,
                    "posX": lastSelectableCell
                };
            }
        }
        return pos;
    },

    navigateRight() {
        return this.navigate("right");
    },

    navigateLeft() {
        return this.navigate("left");
    },

    navigateDown() {
        return this.navigate("down");
    },

    navigateUp() {
        return this.navigate("up");
    },

    navigateNext() {
        return this.navigate("next");
    },

    navigatePrev() {
        return this.navigate("prev");
    },

    navigate(dir) {
        if (!this.activeEl && dir !== "prev" && dir !== "next") {
            return false;
        }

        if (this.currentEditor && !this.commitCurrentEdit()) {
            return true;
        }

        this.setFocus();

        let tabbingDirections = {
            "up": -1,
            "down": 1,
            "left": -1,
            "right": 1,
            "prev": -1,
            "next": 1
        };
        this.tabbingDirection = tabbingDirections[dir];

        let stepFunctions = {
            "up": this.gotoUp,
            "down": this.gotoDown,
            "left": this.gotoLeft,
            "right": this.gotoRight,
            "prev": this.gotoPrev,
            "next": this.gotoNext
        };

        let stepFn = stepFunctions[dir];
        if (stepFn) {
            let pos = stepFn.call(this, this.activeRow, this.activeCol, this.activePosX);
            if (pos) {
                if (this.hasFixedRows && this.opt.fixedBottom && pos.rowIndex === this.getRowsLength()) {
                    return false;
                }
                this.setActiveCell(pos.rowIndex, pos.colIndex);
                return true;
            }
        }

        this.setActiveCell(this.activeRow, this.activeCol);
        return false;

    },
    /*end editor*/

    _onHeaderEvent(e, eventType) {
        let $elem = $(e.target);
        if ($elem.hasClass("vt-col-resize-bar") || this.colWidthChange.isDragging) {
            return;
        }
        let $el = $elem.closest(".vt-col-item", this.$headerBodys);
        let $col = $el.find(".vt-header-col");
        let colIndex = this.getElIndex($col);
        let colItem = this.getCol(colIndex);
        if (!colItem) {
            return;
        }
        let d = {
            e: e,
            col: colItem,
            el: $el
        };
        if (eventType === "onHeaderClick") {
            this._onHeaderClick(d);
            return;
        }
        this.trigger(eventType, d);
    },

    _onHeaderClick(d) {
        let $elem = $(d.e.target);
        let currentTarget = d.e.currentTarget;
        let inExpandCollapseTotalIcon = $elem.closest(".vt-expand-collapse-total-icon", currentTarget);
        if (inExpandCollapseTotalIcon.length) {
            d.el = $elem;
            this.trigger("onMultiLevelAllClick", d);
            return;
        }
        let inCheckboxTotal = $elem.closest(".vt-checkbox-total", currentTarget);
        if (inCheckboxTotal.length) {
            d.el = $elem;
            this.trigger("onCheckboxTotalClick", d);
            return;
        }
        let inColName = $elem.closest(".vt-col-name", currentTarget);
        let inSortIcon = $elem.closest(".vt-sort", currentTarget);
        let isSortElem = inColName.length || inSortIcon.length;
        let colItem = d.col;
        if (isSortElem && this.isColSortable(colItem) && !colItem._isMultiLevelGroup) {
            if (this.sortCol && this.sortCol.id === colItem.id) {
                colItem.sortAsc = !colItem.sortAsc;
            } else {
                if (typeof(colItem.sortAsc) !== "boolean") {
                    colItem.sortAsc = this.opt.sortAsc
                }

            }
            this.sortCol = colItem
            this.trigger("onSort", d)
        }
        this.trigger("onHeaderClick", d)

    },

    _onScrollChange(e, d, delayRender) {
        this.scrollLeft = d.scrollLeft
        this.scrollTop = d.scrollTop
        this.scrollTopOffset = d.scrollTopOffset
        this._doScrollRender(delayRender)
    },

    _onKeyDown(e) {
        this.trigger("onKeyDown", {
            e: e,
            row: this.activeRow,
            col: this.activeCol
        });

        let handled = e.isImmediatePropagationStopped();

        if (!handled) {
            if (!e.shiftKey && !e.altKey && !e.ctrlKey) {
                if (e.which === 27) {
                    if (!this.currentEditor) {
                        return; // no editing mode to cancel, allow bubbling and default processing (exit without cancelling the event)
                    }
                    this.cancelEditAndSetFocus();
                } else if (e.which === 34) {
                    this.navigatePageDown();
                    handled = true;
                } else if (e.which === 33) {
                    this.navigatePageUp();
                    handled = true;
                } else if (e.which === 37) {
                    handled = this.navigateLeft();
                } else if (e.which === 39) {
                    handled = this.navigateRight();
                } else if (e.which === 38) {
                    handled = this.navigateUp();
                } else if (e.which === 40) {
                    handled = this.navigateDown();
                } else if (e.which === 9) {
                    handled = this.navigateNext();
                } else if (e.which === 13) {
                    if (this.currentEditor) {
                        if (this.currentEditor.toString() !== "text") {
                            return;
                        }
                        // adding new row
                        if (this.activeRow === this.getRowsLength()) {
                            this.navigateDown();
                        } else {
                            this.commitEditAndSetFocus();
                        }
                    } else {
                        if (this.commitCurrentEdit()) {
                            this.createCellEditor();
                        }
                    }
                    handled = true;
                }
            } else if (e.which === 9 && e.shiftKey && !e.ctrlKey && !e.altKey) {
                handled = this.navigatePrev();
            }
        }
        if (handled) {
            // the event has been handled so don't let parent element (bubbling/propagation) or browser (default) handle it
            e.stopPropagation();
            e.preventDefault();
        }
    },

    _onCellElHover(e, hover) {
        let post = this.getPostByEvt(e)
        if (!post) {
            return
        }
        if (!hover) {
            this.trigger("onCellMouseOut", post)
            return
        }
        this.trigger("onCellMouseOver", post)
    },

    _onCellHover(e, hover) {
        let post = this.getPostByEvt(e);
        if (!post) {
            return;
        }
        if (!hover) {
            this.trigger("onCellMouseLeave", post);
            return;
        }
        this.trigger("onCellMouseEnter", post);
    },

    _onRowHover(e, hover) {
        let rowIndex = parseInt($(e.currentTarget).attr("idx"), 10);
        let rowItem = this.getRow(rowIndex);
        if (!rowItem) {
            return this;
        }
        let eventData = {
            e: e,
            rowIndex: rowIndex,
            row: rowItem
        }
        let hoverRow = this.$itemBodys.find(".vt-hover");
        if (hoverRow.length) {
            hoverRow.removeClass("vt-hover");
            let hoverRowIndex = parseInt(hoverRow.attr("idx"), 10);
            this._onRowHoverCell(hoverRowIndex, false);
        }
        if (!hover) {
            this.trigger("onRowMouseLeave", eventData);
            return this;
        }
        if (!rowItem._fixed) {
            this.$itemBodys.find(".vt-tr[idx='" + rowIndex + "']").addClass('vt-hover');
            this._onRowHoverCell(rowIndex, true);
        }
        this.trigger("onRowMouseEnter", eventData);
        return this;
    },

    _onClick(e) {
        let post = this.getPostByEvt(e);
        if (!post) {
            return;
        }
        let col = this.cols[post.colIndex];
        if (!col) {
            return;
        }
        let target = e.target;
        let $target = $(target);
        let currentTarget = e.currentTarget;
        let inMultiLevelIcon = $target.closest(".vt-multiLevel-icon", currentTarget);
        if (inMultiLevelIcon.length) {
            post.el = $target;
            this.trigger("onMultiLevelClick", post);
            return;
        }
        let inCheckboxIcon = $target.closest(".vt-checkbox", currentTarget);
        if (inCheckboxIcon.length) {
            post.el = $target;
            this.trigger("onCheckboxClick", post);
            return;
        }
        this.trigger("onClick", post);

        //editor
        if (this.currentEditor !== null && this.activeRow === post.rowIndex && this.activeCol === post.colIndex) {
            return;
        }
        if (!this.currentEditor) {
            // if this click resulted in some cell child node getting focus,
            // don't steal it back - keyboard events will still bubble up
            // IE9+ seems to default DIVs to tabIndex=0 instead of -1, so check for cell clicks directly.
            if (target !== document.activeElement || $target.hasClass("vt-cell")) {
                this.setFocus();
            }
        }

        if (this.isCellEditable(post.rowIndex, post.colIndex)) {
            if (!this.currentEditor || this.commitCurrentEdit()) {
                if (!this.isFixedRow(post.rowIndex)) {
                    let rowData = this.getRow(post.rowIndex);
                    this.scrollItemIntoView(rowData, null);
                }
                let cellEl = this.getCellEl(post.rowIndex, post.colIndex);
                this.setActiveCellEl(cellEl);
            }
        }
    },

    _onContextMenu(e) {
        let post = this.getPostByEvt(e);
        if (!post) {
            return;
        }
        this.trigger("onContextMenu", post);
    },

    _onDblClick(e) {
        let post = this.getPostByEvt(e);
        if (!post) {
            return;
        }
        this.trigger("onDblClick", post);
        if (this.currentEditor !== null && this.activeRow === post.rowIndex && this.activeCol === post.colIndex) {
            return;
        }
        if (e.isImmediatePropagationStopped()) {
            return;
        }
        this.editCellHandler(post.rowIndex, post.colIndex);
    },

    //create random namespace row and cell style sheet cssRules
    _createRowCellStyleSheet() {
        this._removeRowCellStyleSheet();
        this.$style = $("<style type='text/css' rel='stylesheet' uid='" + this.uid + "'/>").appendTo($("head"));
        let namespace = "." + this.uid + " ";
        let sheetCssRules = [];
        let h = this.opt.lineHeight;
        sheetCssRules.push(namespace + ".vt-tr { height : " + h + "px; line-height : " + h + "px; }");

        let cols = this.cols;
        for (let i = 0, l = cols.length; i < l; i++) {
            sheetCssRules.push(namespace + ".vt-td-" + i + " { }");
        }

        this.$style.append(sheetCssRules.join(" "));

        //cache row and cell selector to hash object
        let _cssRules = this.$style[0].sheet.cssRules;
        this.rowCellCssRuleMap = {};
        for (let i = 0, l = _cssRules.length; i < l; i++) {
            let _rule = _cssRules[i]
            let _selector = (_rule.selectorText + "").split(namespace).join("");
            this.rowCellCssRuleMap[_selector] = _rule;
        }
    },

    _removeRowCellStyleSheet(uid) {
        if (this.$style) {
            this.$style.remove();
            this.$style = null;
        }
        if (uid) {
            $('style[uid="' + uid + '"]').remove();
        }
        this.rowCellCssRuleMap = null;
    },

    _getRowCellCssRule(className) {
        return this.rowCellCssRuleMap[className];
    },

    _updateRowCellCssRule(index, left, width) {
        let rule = this._getRowCellCssRule(".vt-td-" + index);
        if (!rule) {
            return;
        }
        rule.style.left = left + "px";
        rule.style.width = width + "px";

        if (width === 0) {
            rule.style.display = "none";
        } else {
            rule.style.display = "";
        }
    },

    _getColElWidth(col) {
        let width = col.width;
        if (col._hidden || width <= 0) {
            width = 0;
        }
        return width;
    },

    _updateRowCellCssRules() {
        let opt = this.opt;
        let cols = this.cols;
        let colsLen = cols.length;
        let left = 0;
        let len = cols.length;
        cols.forEach((col, index) => {
            let width = this._getColElWidth(col);
            if (opt.fixedRightCol + index === colsLen) {
                left = 0
            }
            this._updateRowCellCssRule(index, left, width);
            if (opt.fixedCol === index) {
                left = 0;
            } else {
                left += width;
            }
        })
    },

    removeEl(el) {
        if (el && el.parentNode) {
            el.parentNode.removeChild(el);
        }
    },

    appendEl(parent, el) {
        if (parent && el) {
            parent.appendChild(el);
        }
    },

    find(context, container) {
        return $(container || this.$container).find(context);
    },

    getElIndex(el) {
        let index = parseInt($(el).attr("idx"), 10);
        return index;
    },

    getTextWidth(text) {
        let $text = $("<span/>").css("visibility", "hidden").html(text).appendTo(this.$container);
        let width = $text.width();
        $text.remove();

        return width;
    },

    //resize
    resize() {
        if (!this.headerRendered) {
            return;
        }
        this.containerWidth = this.$container.width();
        this.containerHeight = this.$container.height();
        this.headerWidth = this.containerWidth;
        this.bodyerWidth = this.containerWidth;

        this.$tableHeader.width(this.headerWidth);
        this.headerHeight = 0;
        if (this.opt.header) {
            this.updateHeaderHeight();
        }
        this.$tableHeader.height(this.headerHeight);

        this.updateBodySize();
        this.render();
    },

    updateHeaderHeight() {
        let headerLeft = this.$headerBodyL.find(".vt-header-table");
        let headerCenter = this.$headerBodyC.find(".vt-header-table");
        let headerRt = this.$headerBodyRt.find(".vt-header-table");
        headerLeft.css({
            display: "block",
            height: ""
        });
        headerCenter.css({
            display: "block",
            height: ""
        });
        headerRt.css({
            display: "block",
            height: ""
        });
        let headerLeftH = headerLeft.height();
        let headerCenterH = headerCenter.height();
        let headerRtH = headerRt.height();
        let headerH = Math.max(headerLeftH, headerCenterH, headerRtH);
        headerLeft.css({
            display: "",
            height: headerH
        });
        headerCenter.css({
            display: "",
            height: headerH
            //width: "100%"
        });
        headerRt.css({
            display: "",
            height: headerH
            //width: "100%"
        });
        this.headerHeight = headerH;
    },

    updateBodySize(updateRowCellCssRules) {
        this._updateScrollStatus();
        this.bodyerHeight = this.containerHeight - this.headerHeight;
        this.$tableBody.width(this.bodyerWidth);
        this.$tableBody.height(this.bodyerHeight);
        this.itemBodyWidthChanged = false;
        this.updateItemWidth();
        this.updateItemHeight();
        this.updateItemBodyWidth();
        this.updateItemBodyHeight();
        this._updateScroll();
        if (updateRowCellCssRules || this.itemBodyWidthChanged) {
            this._updateRowCellCssRules();
        }
    },

    updateItemWidth() {
        this.updateHeaderVisibility();
        let itemWidthL = this.bodyerWidth;
        let itemWidthC = 0;
        let itemWidthRt = 0;
        if (this.hasFixedCols) {
            itemWidthL = this.colsWidthL;
            itemWidthC = this.bodyerWidth - itemWidthL;
            if (Common.isNumber(this.opt.fixedRightCol)) {
                itemWidthRt = this.colsWidthRt;
                itemWidthC = itemWidthC - itemWidthRt;
            }

            if (this.hideScroll) {
                let scrollbarW = this.getScrollBarWidth();
                if (itemWidthC < scrollbarW) {
                    itemWidthC = scrollbarW;
                }
                itemWidthL = Math.max(0, this.bodyerWidth - itemWidthC);
                if (Common.isNumber(this.opt.fixedRightCol)) {
                    itemWidthL = Math.max(0, itemWidthL - itemWidthRt);
                }
            }
        }

        this.itemWidthL = itemWidthL;
        this.itemWidthC = itemWidthC;
        this.itemWidthRt = itemWidthRt;
        this.$tableHeaderL.css({
            left: 0,
            width: this.itemWidthL
        });
        this.$tableHeaderC.css({
            left: this.itemWidthL,
            width: this.itemWidthC
        });
        this.$tableHeaderRt.css({
            left: this.itemWidthL + this.itemWidthC,
            width: this.itemWidthRt
        });

        this.$itemTopL.css({
            left: 0,
            width: this.itemWidthL
        });
        this.$itemTopC.css({
            left: this.itemWidthL,
            width: this.itemWidthC
        });
        this.$itemTopRt.css({
            left: this.itemWidthL + this.itemWidthC,
            width: this.itemWidthRt
        });

        this.$itemBottomL.css({
            left: 0,
            width: this.itemWidthL
        });
        this.$itemBottomC.css({
            left: this.itemWidthL,
            width: this.itemWidthC
        });
        this.$itemBottomRt.css({
            left: this.itemWidthL + this.itemWidthC,
            width: this.itemWidthRt
        });
    },

    updateHeaderVisibility() {
        if (this._instanceCacheInfo.hasScrollHeader === this.hideScroll) {
            return;
        }
        this._instanceCacheInfo.hasScrollHeader = this.hideScroll;
        let headerC = this.$headerBodyC.get(0);
        if (this.hideScroll) {
            headerC.style.visibility = "hidden";
        } else {
            headerC.style.visibility = "";
        }
        this.updateColsHidden(this.hideScroll);
        this.itemBodyWidthChanged = true;

    },

    updateColsHidden(hidden) {
        let fixedCol = this.opt.fixedCol;
        let cols = this.cols;
        for (let i = fixedCol + 1, l = cols.length - 1; i < l; i++) {
            let col = cols[i];
            col.vt_hidden = hidden;
        }
    },

    updateItemHeight() {
        let itemHeightT = this.bodyerHeight;
        let itemHeightB = 0;
        if (this.hasFixedRows) {
            if (this.opt.fixedBottom) {
                let scrollbarH = this.getScrollBarHeight();
                itemHeightT = this.bodyerHeight - this.fixedHeight - scrollbarH;
                itemHeightB = this.fixedHeight + scrollbarH;
            } else {
                itemHeightT = this.fixedHeight;
                itemHeightB = this.bodyerHeight - this.fixedHeight;
            }
        }
        this.itemHeightT = itemHeightT;
        this.itemHeightB = itemHeightB;

        this.$itemTopL.css({
            top: 0,
            height: this.itemHeightT
        });
        this.$itemTopC.css({
            top: 0,
            height: this.itemHeightT
        });
        this.$itemTopRt.css({
            top: 0,
            height: this.itemHeightT
        });
        this.$itemBottomL.css({
            top: this.itemHeightT,
            height: this.itemHeightB
        });
        this.$itemBottomC.css({
            top: this.itemHeightT,
            height: this.itemHeightB
        });
        this.$itemBottomRt.css({
            top: this.itemHeightT,
            height: this.itemHeightB
        });

    },

    updateItemBodyWidth() {
        let itemBodyWidthL = this.colsWidthL;
        let itemBodyWidthC = this.colsWidthC;
        let itemBodyWidthRt = this.colsWidthRt;
        if (itemBodyWidthL !== this.itemBodyWidthL ||
            itemBodyWidthC !== this.itemBodyWidthC ||
            itemBodyWidthRt !== this.itemBodyWidthRt) {
            this.itemBodyWidthL = itemBodyWidthL;
            this.itemBodyWidthC = itemBodyWidthC;
            this.itemBodyWidthRt = itemBodyWidthRt;
            this.itemBodyWidthChanged = true;
        }
        if (this.itemBodyWidthChanged || this.scrollStatusChanged) {
            this.updateHeaderWidth();
            this.updateTableBodyWidth();
        }
    },

    updateItemBodyHeight() {
        let opt = this.opt;
        let itemBodyHeightT;
        let itemBodyHeightB;
        if (this.hasFixedRows) {
            if (opt.fixedBottom) {
                itemBodyHeightT = this.scrollHeight;
                itemBodyHeightB = this.fixedHeight;
            } else {
                itemBodyHeightT = this.fixedHeight;
                itemBodyHeightB = this.scrollHeight;
            }
        } else {
            itemBodyHeightT = this.totalHeight;
            itemBodyHeightB = 0;
        }
        this.itemBodyHeightT = itemBodyHeightT;
        this.itemBodyHeightB = itemBodyHeightB;
        this.updateTableBodyHeight();
    },

    updateHeaderWidth() {
        this.$headerBodyL.width(this.itemBodyWidthL);
        this.$headerBodyC.width(this.itemBodyWidthC);
        this.$headerBodyRt.width(this.itemBodyWidthRt);
    },

    updateTableBodyWidth() {
        this.$itemBodyTopL.width(this.itemBodyWidthL);
        this.$itemBodyBottomL.width(this.itemBodyWidthL);
        this.$itemBodyTopC.width(this.itemBodyWidthC);
        this.$itemBodyBottomC.width(this.itemBodyWidthC);
        this.$itemBodyTopRt.width(this.itemBodyWidthRt);
        this.$itemBodyBottomRt.width(this.itemBodyWidthRt);
    },

    updateTableBodyHeight() {
        this.$itemBodyTopL.height(this.itemBodyHeightT);
        this.$itemBodyTopC.height(this.itemBodyHeightT);
        this.$itemBodyTopRt.height(this.itemBodyHeightT);
        this.$itemBodyBottomL.height(this.itemBodyHeightB);
        this.$itemBodyBottomC.height(this.itemBodyHeightB);
        this.$itemBodyBottomRt.height(this.itemBodyHeightB);
    },

    //scroll

    setScroll(x, y) {
        if (x === this.scrollLeft && y === this.scrollTop) {
            return this;
        }
        this.scrollLeft = x;
        this.scrollTop = y;
        this._doScroll();
        return this;
    },

    setScrollLeft(x) {
        if (x === this.scrollLeft) {
            return this;
        }
        this.scrollLeft = x;
        this._doScroll();
        return this;
    },

    setScrollTop(y) {
        if (y === this.scrollTop) {
            return this;
        }
        this.scrollTop = y;
        this._doScroll();
        return this;
    },

    getScrollRowPosition(rowItem) {
        if (!rowItem) {
            return null;
        }
        let o = this.opt;
        let rowIndex = rowItem._index;
        if (this.hasFixedRows) {
            rowIndex -= o.fixedRow + 1;
        }
        if (rowIndex >= 0) {
            let rowPosition = rowIndex * o.lineHeight;
            return rowPosition;
        }
        return null;
    },

    getScrollColPosition(colItem) {
        if (!colItem) {
            return null;
        }
        let x = colItem._left;
        if (this.hasFixedCols) {
            x -= this.itemBodyWidthL;
        }
        if (x >= 0) {
            return x;
        }
        return null;
    },

    scrollToItem(rowItem, colItem) {
        this.scrollToChanged = false;
        this._doScrollToRow(rowItem);
        this._doScrollToCol(colItem);
        if (!this.scrollToChanged) {
            return this;
        }
        this._doScroll();
        return this;
    },

    scrollItemIntoView(rowItem, colItem) {
        this.scrollIntoViewChanged = false;
        this._doScrollRowIntoView(rowItem);
        this._doScrollColIntoView(colItem);
        if (!this.scrollIntoViewChanged) {
            return this;
        }
        this._doScroll();
        return this;
    },

    getScrollViewWidth() {
        let scrollViewWidth = this.getScrollWidth();
        scrollViewWidth -= this.getScrollBarWidth();
        return scrollViewWidth;
    },

    getScrollViewHeight() {
        let scrollViewHeight = this.getScrollHeight();
        if (!this.opt.fixedBottom) {
            scrollViewHeight -= this.getScrollBarHeight();
        }
        return scrollViewHeight;
    },

    getScrollWidth() {
        let scrollWidth = this.scroll.width();
        return scrollWidth;
    },

    getScrollHeight() {
        let scrollHeight = this.scroll.height();
        return scrollHeight;
    },

    getScrollBarWidth() {
        if (this.hasVScroll) {
            return this.scrollbarSize;
        }
        return 0;
    },

    getScrollBarHeight() {
        if (this.hasHScroll) {
            return this.scrollbarSize;
        }
        return 0;
    },

    getScrollLeft() {
        let scrollLeft = this.scroll.getScrollLeft();
        return scrollLeft;
    },

    getScrollTop() {
        let scrollTop = this.scroll.getScrollTop();
        return scrollTop;
    },

    _doScrollToRow(rowItem) {
        if (!rowItem) {
            return;
        }
        let rowPosition = this.getScrollRowPosition(rowItem);
        if (!Common.isNumber(rowPosition)) {
            return;
        }
        if (rowPosition === this.scrollTop) {
            return;
        }
        this.scrollTop = rowPosition;
        this.scrollToChanged = true;
    },

    _doScrollToCol(colItem) {
        if (!colItem) {
            return;
        }
        let colPosition = this.getScrollColPosition(colItem);
        if (!Common.isNumber(colPosition)) {
            return;
        }
        if (colPosition === this.scrollLeft) {
            return;
        }
        this.scrollLeft = colPosition;
        this.scrollToChanged = true;
    },

    _doScrollRowIntoView(rowItem) {
        if (!rowItem) {
            return;
        }
        let rowPosition = this.getScrollRowPosition(rowItem);
        if (!Common.isNumber(rowPosition)) {
            return;
        }
        if (rowPosition < this.scrollTop) {
            this.scrollTop = rowPosition;
            this.scrollIntoViewChanged = true;
            return;
        }
        let lineHeight = this.opt.lineHeight;
        let scrollViewHeight = this.getScrollViewHeight();

        if (rowPosition + lineHeight > this.scrollTop + scrollViewHeight) {
            let top = rowPosition - (scrollViewHeight - lineHeight);
            this.scrollTop = top;
            this.scrollIntoViewChanged = true;
            return;
        }

    },

    _doScrollColIntoView(colItem) {
        if (!colItem) {
            return;
        }
        let colPosition = this.getScrollColPosition(colItem);
        if (!Common.isNumber(colPosition)) {
            return;
        }
        if (colPosition < this.scrollLeft) {
            this.scrollLeft = colPosition;
            this.scrollIntoViewChanged = true;
            return;
        }
        let colWidth = colItem.width;
        let scrollViewWidth = this.getScrollViewWidth();
        if (colPosition + colWidth > this.scrollLeft + scrollViewWidth) {
            let left = colPosition - (scrollViewWidth - colWidth);
            this.scrollLeft = left;
            this.scrollIntoViewChanged = true;
            return;
        }

    },

    _doScroll() {
        this.scroll.setPosition(this.scrollLeft, this.scrollTop);
        this._doScrollRender();
    },

    _doScrollRender(delayRender) {
        this._preventDefault_ = true;
        if (this._instanceCacheInfo.scrollTopOffset !== this.scrollTopOffset) {
            this._instanceCacheInfo.scrollTopOffset = this.scrollTopOffset;
            this._updateCacheTopOffset();
        }
        if (this._instanceCacheInfo.scrollLeft === this.scrollLeft && this._instanceCacheInfo.scrollTop === this.scrollTop) {
            this._preventDefault_ = false;
            return;
        }
        let distanceLeft = Math.abs(this.scrollLeft - this._instanceCacheInfo.scrollLeft);
        let distanceTop = Math.abs(this.scrollTop - this._instanceCacheInfo.scrollTop);

        this._instanceCacheInfo.scrollLeft = this.scrollLeft;
        this._instanceCacheInfo.scrollTop = this.scrollTop;

        let scrollRender = true;
        if(delayRender) {
            scrollRender = this._debonceScrollRenderHandler(distanceLeft, distanceTop);
        }else {
           this.render() 
        }

        this.trigger("onScroll", {
            scrollLeft: this.scrollLeft,
            scrollTop: this.scrollTop,
            scrollRender: scrollRender
        });

    },

    _debonceScrollRenderHandler(distanceLeft, distanceTop) {
        /*if distance time less 20 or scroll distance less 20 then delayRender, else render*/
        var now_time = new Date().getTime();
        var d = now_time - this.lastRenderTime;
        if (d < 20 || (distanceLeft < 20 && distanceTop < 20)) {
            this.delayRender();
            return false;
        }
        this.render();
        return true;
    },

    _updateCacheTopOffset() {
        let self = this;
        let cacheRows = this.getCacheRows();
        cacheRows.forEach((rowIndex) => {
            if (rowIndex <= self.opt.fixedRow) {
                return;
            }
            let rowEls = self.getRowEls(rowIndex);
            if (rowEls) {
                let rowTop = self.getRowPosTopNum(rowIndex);
                rowEls.css("top", rowTop);
            }
        });

    },

    _initFixedInfo() {
        let opt = this.opt;
        //fixedCol 是需要固定列的索引
        let fixedCol = opt.fixedCol;
        let fixedRightCol = opt.fixedRightCol;
        let isNumber_fixedRightCol = Common.isNumber(fixedRightCol);
        if (fixedCol > -1) {
            this.hasFixedCols = true;
            //fixedCols代表固定的列数量
            opt.fixedCols = Math.max(0, fixedCol + 1);
            if (isNumber_fixedRightCol) {
                this.hasFixedRightCols = true;
            } else {
                this.hasFixedRightCols = false;
            }
        } else {
            if (isNumber_fixedRightCol) {
                this.hasFixedCols = true;
                this.hasFixedRightCols = true;
                opt.fixedCols = 0;
            } else {
                this.hasFixedCols = false;
                this.hasFixedRightCols = false;
                opt.fixedCols = 0;
            }

        }

        if (opt.fixedRow > -1) {
            this.hasFixedRows = true;
            opt.fixedRows = Math.max(0, opt.fixedRow + 1);
            this.fixedHeight = opt.fixedRows * opt.lineHeight;
        } else {
            this.hasFixedRows = false;
            opt.fixedRows = 0;
            this.fixedHeight = 0;
        }

        if (this.hasFixedCols) {
            let fixedClassName = "vt-fixed"
            if(this.hasFixedRightCols) {
                fixedClassName += " vt-fixed-right"
            }
            this.$itemBodyTopL.addClass(fixedClassName + " vt-top-left-table");
            this.$itemBodyTopC.addClass(fixedClassName + " vt-top-center-table");
            this.$itemBodyTopRt.addClass(fixedClassName + " vt-top-right-table");
            this.$itemBodyBottomL.addClass(fixedClassName + " vt-bottom-left-table");
            this.$itemBodyBottomC.addClass(fixedClassName + " vt-bottom-center-table");
            this.$itemBodyBottomRt.addClass(fixedClassName + " vt-bottom-right-table");

            
            //
            this.$tableHeaderC.show();
            this.$itemTopC.show();
            if (this.hasFixedRightCols) {
                this.$tableHeaderRt.show();
                this.$itemTopRt.show();
            } else {
                this.$tableHeaderRt.hide();
                this.$itemTopRt.hide();
            }

            if (this.hasFixedRows) {
                this.$itemBottomL.show();
                this.$itemBottomC.show();
                if (this.hasFixedRightCols) {
                    this.$itemBottomRt.show();
                } else {
                    this.$itemBottomRt.hide();
                }
            } else {
                this.$itemBottomL.hide();
                this.$itemBottomC.hide();
                this.$itemBottomRt.hide();
            }
        } else {
            this.$itemBodyTopL.addClass("vt-fixed vt-top-table");
            this.$itemBodyTopC.addClass("vt-fixed vt-top-table");
            this.$itemBodyTopRt.addClass("vt-fixed vt-top-table");
            this.$itemBodyBottomL.addClass("vt-fixed vt-bottom-table");
            this.$itemBodyBottomC.addClass("vt-fixed vt-bottom-table");
            this.$itemBodyBottomRt.addClass("vt-fixed vt-bottom-table");
            //
            this.$tableHeaderC.hide();
            this.$itemTopC.hide();
            this.$itemBottomC.hide();

            if (this.hasFixedRightCols) {
                this.$tableHeaderRt.show();
                this.$itemTopRt.show();
                this.$itemBottomRt.show();
            } else {
                this.$tableHeaderRt.hide();
                this.$itemTopRt.hide();
                this.$itemBottomRt.hide();
            }


            if (this.hasFixedRows) {
                this.$itemBottomL.show();
            } else {
                this.$itemBottomL.hide();
                this.$itemBottomRt.hide();
            }
        }
    },

    _removeScroll() {
        if (!this.scrollList) {
            return this;
        }
        this.scrollList.forEach(function(scroll) {
            if (scroll) {
                scroll.destroy();
            }
        });
        this.scrollList = null;
    },

    _createScroll() {
        this._removeScroll();
        this.scrollHeaderL = new Common.scroll(this.$tableHeaderL);
        this.scrollHeaderC = new Common.scroll(this.$tableHeaderC);
        this.scrollHeaderRt = new Common.scroll(this.$tableHeaderRt);
        this.scrollTopL = new Common.scroll(this.$itemTopL);
        this.scrollTopC = new Common.scroll(this.$itemTopC);
        this.scrollTopRt = new Common.scroll(this.$itemTopRt);
        this.scrollBottomL = new Common.scroll(this.$itemBottomL);
        this.scrollBottomC = new Common.scroll(this.$itemBottomC);
        this.scrollBottomRt = new Common.scroll(this.$itemBottomRt);
        this.scrollList = [
            this.scrollHeaderL,
            this.scrollHeaderC,
            this.scrollHeaderRt,
            this.scrollTopL,
            this.scrollTopC,
            this.scrollTopRt,
            this.scrollBottomL,
            this.scrollBottomC,
            this.scrollBottomRt
        ];
        this.scrollTopL.setHorizScrollList([this.scrollHeaderL, this.scrollBottomL]);
        this.scrollTopL.setVerticalScrollList([this.scrollTopC, this.scrollTopRt]);

        this.scrollTopC.setHorizScrollList([this.scrollHeaderC, this.scrollBottomC]);
        this.scrollTopC.setVerticalScrollList([this.scrollTopL, this.scrollTopRt]);
        //scrollTopRt not need setHorizScrollList
        this.scrollTopRt.setVerticalScrollList([this.scrollTopL, this.scrollTopC]);

        this.scrollBottomL.setHorizScrollList([this.scrollHeaderL, this.scrollTopL]);
        this.scrollBottomL.setVerticalScrollList([this.scrollBottomC, this.scrollBottomRt]);

        this.scrollBottomC.setHorizScrollList([this.scrollHeaderC, this.scrollTopC]);
        this.scrollBottomC.setVerticalScrollList([this.scrollBottomL, this.scrollBottomRt]);

        //scrollBottomRt not need setHorizScrollList
        this.scrollBottomRt.setVerticalScrollList([this.scrollBottomL, this.scrollBottomC]);


        if (this.hasFixedRows && !this.opt.fixedBottom) {
            if (this.hasFixedCols) {
                this.scroll = this.scrollBottomC;
            } else {
                this.scroll = this.scrollBottomL;
            }
        } else {
            if (this.hasFixedCols) {
                this.scroll = this.scrollTopC;
            } else {
                this.scroll = this.scrollTopL;
            }
        }
    },

    _updateScroll() {
        let scrollOpt = this._getScrollOpt();
        this.scrollHeaderL.render({
            scrollW: this.itemWidthL,
            scrollH: this.headerHeight,
            scrollBodyW: this.itemBodyWidthL,
            scrollBodyH: this.headerHeight,
            scrollBarV: scrollOpt.hdLeftV,
            scrollBarH: scrollOpt.hdLeftH
        });
        this.scrollHeaderC.render({
            scrollW: this.itemWidthC,
            scrollH: this.headerHeight,
            scrollBodyW: this.itemBodyWidthC,
            scrollBodyH: this.headerHeight,
            scrollBarV: scrollOpt.hdCenterV,
            scrollBarH: scrollOpt.hdCenterH
        });

        this.scrollHeaderRt.render({
            scrollW: this.itemWidthRt,
            scrollH: this.headerHeight,
            scrollBodyW: this.itemBodyWidthRt,
            scrollBodyH: this.headerHeight,
            scrollBarV: scrollOpt.hdRtV,
            scrollBarH: scrollOpt.hdRtH
        });


        this.scrollTopL.render({
            scrollW: this.itemWidthL,
            scrollH: this.itemHeightT,
            scrollBodyW: this.itemBodyWidthL,
            scrollBodyH: this.itemBodyHeightT,
            scrollBarV: scrollOpt.topLeftV,
            scrollBarH: scrollOpt.topLeftH
        });
        this.scrollTopC.render({
            scrollW: this.itemWidthC,
            scrollH: this.itemHeightT,
            scrollBodyW: this.itemBodyWidthC,
            scrollBodyH: this.itemBodyHeightT,
            scrollBarV: scrollOpt.topCenterV,
            scrollBarH: scrollOpt.topCenterH
        });

        this.scrollTopRt.render({
            scrollW: this.itemWidthRt,
            scrollH: this.itemHeightT,
            scrollBodyW: this.itemBodyWidthRt,
            scrollBodyH: this.itemBodyHeightT,
            scrollBarV: scrollOpt.topRtV,
            scrollBarH: scrollOpt.topRtH
        });

        this.scrollBottomL.render({
            scrollW: this.itemWidthL,
            scrollH: this.itemHeightB,
            scrollBodyW: this.itemBodyWidthL,
            scrollBodyH: this.itemBodyHeightB,
            scrollBarV: scrollOpt.btLeftV,
            scrollBarH: scrollOpt.btLeftH
        });
        this.scrollBottomC.render({
            scrollW: this.itemWidthC,
            scrollH: this.itemHeightB,
            scrollBodyW: this.itemBodyWidthC,
            scrollBodyH: this.itemBodyHeightB,
            scrollBarV: scrollOpt.btCenterV,
            scrollBarH: scrollOpt.btCenterH
        });

        this.scrollBottomRt.render({
            scrollW: this.itemWidthRt,
            scrollH: this.itemHeightB,
            scrollBodyW: this.itemBodyWidthRt,
            scrollBodyH: this.itemBodyHeightB,
            scrollBarV: scrollOpt.btRtV,
            scrollBarH: scrollOpt.btRtH
        });


    },

    _getScrollOpt() {
        let sclOpt = {
            hdLeftH: {
                size: 0,
                space: false
            },
            hdLeftV: {
                size: 0,
                space: false
            },
            hdCenterH: {
                size: 0,
                space: false
            },
            hdCenterV: {
                size: 0,
                space: false
            },
            hdRtH: {
                size: 0,
                space: false
            },
            hdRtV: {
                size: 0,
                space: false
            },
            topLeftH: {
                size: 0,
                space: false
            },
            topLeftV: {
                size: 0,
                space: false
            },
            topCenterH: {
                size: 0,
                space: false
            },
            topCenterV: {
                size: 0,
                space: false
            },
            topRtH: {
                size: 0,
                space: false
            },
            topRtV: {
                size: 0,
                space: false
            },
            btLeftH: {
                size: 0,
                space: false
            },
            btLeftV: {
                size: 0,
                space: false
            },
            btCenterH: {
                size: 0,
                space: false
            },
            btCenterV: {
                size: 0,
                space: false
            },
            btRtH: {
                size: 0,
                space: false
            },
            btRtV: {
                size: 0,
                space: false
            }
        };

        this._scrollbarOpt(sclOpt);
        return sclOpt;
    },

    _scrollbarOpt(sclOpt) {
        let size = this.scrollbarSize;
        if (this.hasVScroll) {
            if (this.hasFixedCols) {
                if (this.hasFixedRightCols) {
                    sclOpt.hdRtV.size = size;
                    sclOpt.hdRtV.space = 1;

                } else {
                    sclOpt.hdCenterV.size = size;
                    sclOpt.hdCenterV.space = 1;
                }
            } else {
                sclOpt.hdLeftV.size = size;
                sclOpt.hdLeftV.space = 1;
            }
        }
        if (this.hasFixedCols) {
            if (this.hasFixedRows) {
                if (this.opt.fixedBottom) {
                    this._scrollbarFixedColRowBottom(sclOpt, size);
                } else {
                    this._scrollbarFixedColRowTop(sclOpt, size);
                }
            } else {
                if (this.hasFixedRightCols) {
                    sclOpt.topCenterH.size = size;
                    sclOpt.topRtV.size = size;
                } else {
                    sclOpt.topCenterH.size = size;
                    sclOpt.topCenterV.size = size;
                }

                if (this.hasHScroll) {
                    if (this.hideScroll) {
                        sclOpt.topLeftH.size = size;
                        if (this.hasFixedRightCols) {
                            sclOpt.topRtH.size = size;
                            sclOpt.topRtH.space = true;

                        } else {
                            sclOpt.topCenterH.size = size;
                            sclOpt.topCenterH.space = true;
                        }
                    } else {
                        sclOpt.topLeftH.size = size;
                        sclOpt.topLeftH.space = true;
                        if (this.hasFixedRightCols) {
                            sclOpt.topRtH.size = size;
                            sclOpt.topRtH.space = true;
                        }
                    }
                }
            }
        } else {
            if (this.hasFixedRows) {
                if (this.opt.fixedBottom) {
                    this._scrollbarFixedRowBottom(sclOpt, size);
                } else {
                    this._scrollbarFixedRowTop(sclOpt, size);
                }
            } else {
                sclOpt.topLeftH.size = size;
                sclOpt.topLeftV.size = size;
            }
        }
    },


    _scrollbarFixedRowBottom(sclOpt, size) {
        sclOpt.btLeftH.size = size;
        sclOpt.topLeftV.size = size;
        if (this.hasVScroll) {
            sclOpt.btLeftV.size = size;
            sclOpt.btLeftV.space = 1;
        }
    },

    _scrollbarFixedRowTop(sclOpt, size) {
        sclOpt.btLeftH.size = size;
        sclOpt.btLeftV.size = size;
        if (this.hasVScroll) {
            sclOpt.topLeftV.size = size;
            sclOpt.topLeftV.space = 1;
        }
    },

    _scrollbarFixedColRowBottom(sclOpt, size) {
        sclOpt.btCenterH.size = size;
        if (this.hasFixedRightCols) {
            sclOpt.topRtV.size = size;
        } else {
            sclOpt.topCenterV.size = size;
        }

        if (this.hasVScroll) {
            if (this.hasFixedRightCols) {
                sclOpt.btRtV.size = size;
                sclOpt.btRtV.space = 1;
            } else {
                sclOpt.btCenterV.size = size;
                sclOpt.btCenterV.space = 1;
            }

        }
        if (this.hasHScroll) {
            if (this.hideScroll) {
                sclOpt.btLeftH.size = size;
                sclOpt.btCenterH.space = true;
            }
        }

    },

    _scrollbarFixedColRowTop(sclOpt, size) {
        sclOpt.btCenterH.size = size;
        if (this.hasFixedRightCols) {
            sclOpt.btRtV.size = size;
            sclOpt.btRtH.size = size;
            sclOpt.btRtH.space = true;
        } else {
            sclOpt.btCenterV.size = size;
        }

        if (this.hasVScroll) {
            if (this.hasFixedRightCols) {
                sclOpt.topRtV.size = size;
                sclOpt.topRtV.space = 1;
            } else {
                sclOpt.topCenterV.size = size;
                sclOpt.topCenterV.space = 1;
            }

        }
        if (this.hasHScroll) {
            if (this.hideScroll) {
                sclOpt.btLeftH.size = size;
                sclOpt.btCenterH.space = true;
            } else {
                sclOpt.btLeftH.size = size;
                sclOpt.btLeftH.space = true;
            }
        }

    },

    _updateScrollStatus() {
        this._updateGlobalScrollInfo();
        this._updateHScrollStatus();
        this._updateVScrollStatus();
        this._updateSpaceColWidth();
        this._updateSetLastPadding();
        this.scrollStatusChanged = false;
        if (this._instanceCacheInfo.hasHScroll !== this.hasHScroll || this._instanceCacheInfo.hasVScroll !== this.hasVScroll) {
            this.scrollStatusChanged = true;
            this._instanceCacheInfo.hasHScroll = this.hasHScroll;
            this._instanceCacheInfo.hasVScroll = this.hasVScroll;
            this.trigger("onScrollStatusChanged", {
                hasHScroll: this.hasHScroll,
                hasVScroll: this.hasVScroll
            });
        }
    },

    _updateGlobalScrollInfo() {
        this.totalRowsLength = this.rows.length;
        this.totalHeight = this.totalRowsLength * this.opt.lineHeight;
        this.scrollHeight = this.totalHeight - this.fixedHeight;
        this.totalHeight = Math.max(this.totalHeight, 1);
        this.scrollHeight = Math.max(this.scrollHeight, 1);
        this.removeRowsFrom(this.totalRowsLength);
    },

    _updateHScrollStatus() {
        this.hasHScroll = true;
        this._updateColsWidth();
        this._updateHideScrollStatus();
        if (this.hideScroll) {
            return;
        }
        if (this.containerWidth - this.colsWidth >= 0) {
            this.hasHScroll = false;
        }
    },

    _updateHideScrollStatus() {
        this.hideScroll = false;
        if (this.hasFixedCols) {
            let scrollwidth = this.bodyerWidth - this.colsWidthL;
            let scrollMinWidth = this._getScrollMinWidth();
            if (scrollwidth < scrollMinWidth) {
                this.hideScroll = true;
                this.hasHScroll = false;
                let scrollbarW = this.getScrollBarWidth();
                if (scrollwidth < scrollbarW) {
                    this.hasHScroll = true;
                }
            }
        }
    },

    _getScrollMinWidth() {
        let scrollMinWidth = this.opt.scrollMinWidth;
        if (!Common.isNumber(scrollMinWidth) || scrollMinWidth < 0) {
            scrollMinWidth = this.scrollbarSize;
        }
        return scrollMinWidth;
    },

    _updateVScrollStatus() {
        this.hasVScroll = true;
        let self = this;
        let scrollbarH = this.getScrollBarHeight();
        let maxHeight = this.opt.maxHeight
        if (maxHeight > 0) {
            this.containerHeight = this.headerHeight + this.totalHeight + scrollbarH;
            if(this.containerHeight <= maxHeight) {
                this.hasVScroll = false;
                this.$container.height(this.containerHeight);
                
            }else{
                this.hasVScroll = true;
                this.containerHeight = maxHeight;
                this.$container.height(maxHeight);
                
            }    
        } else {
            let tempBodyerHeight = this.containerHeight - this.headerHeight - scrollbarH;
            if (tempBodyerHeight >= this.totalHeight) {
                this.hasVScroll = false;
                
            }
        }

    },
    _updateSetLastPadding() {
        if((!this.hasHScroll ||  this.hasFixedRightCols) && this.hasVScroll) {
           this.$template.addClass("vt-set-last-padding");
        }else{
            this.$template.removeClass("vt-set-last-padding");
        }
        
    },
    _updateColsWidth() {
        this.spaceCol.width = 1;
        let opt = this.opt;
        let cols = this.cols;
        let colsWidthL = 0;
        let colsWidthC = 0;
        let colsWidthRt = 0;

        let fixedCol = opt.fixedCol;
        let fixedRightCol = opt.fixedRightCol;
        let len = cols.length;
        let left = 0;
        for (let i = 0; i < len; i++) {
            let col = cols[i];
            col._left = left;
            let width = col.width;
            if (width > 0) {
                left += width;
                if (this.hasFixedCols && i > fixedCol) {
                    if (Common.isNumber(fixedRightCol)) {
                        if (i + fixedRightCol < len) {
                            colsWidthC += width;
                        } else {
                            colsWidthRt += width;
                        }
                    } else {
                        colsWidthC += width;
                    }

                } else {
                    colsWidthL += width;
                }
            }
        }

        this.colsWidthL = colsWidthL;
        this.colsWidthC = colsWidthC;
        this.colsWidthRt = colsWidthRt;
        this.colsWidth = colsWidthL + colsWidthC + colsWidthRt;

    },

    _updateSpaceColWidth() {
        let spaceColWidth = this.containerWidth - this.colsWidth;
        if (this.hasVScroll && !this.hasHScroll && !this.hasFixedRightCols) {
            spaceColWidth = spaceColWidth - this.scrollbarSize;
        }
        if (!this.hasHScroll) {
            this.colsWidth += spaceColWidth;
            this.colsWidth = Math.max(0, this.colsWidth);
            if (this.hasFixedCols) {
                if (!this.hasFixedRightCols) {
                    this.colsWidthC += spaceColWidth;
                    this.colsWidthC = Math.max(0, this.colsWidthC);
                } else {
                    this.colsWidthRt += spaceColWidth;
                    this.colsWidthRt = Math.max(0, this.colsWidthRt);
                }

            } else {
                this.colsWidthL += spaceColWidth;
                this.colsWidthL = Math.max(0, this.colsWidthL);
            }
            this.spaceCol.width = Math.max(1, spaceColWidth);
        }
        //update space col el style width
        let $spaceColEl = this.getHeaderEl(this.spaceCol);
        this.setColElWidth($spaceColEl, this.spaceCol.width);
        this.updateColGroupWidth(this.spaceCol);
    },

    destroy() {
        this._instanceCacheInfo = {};
        this.trigger("onDestroy");
        this.cancelCurrentEdit();
        this.$container.removeAttr("_id");
        this.$container.unbind(".vt");
        this._removeRowCellStyleSheet();
        this.unbind();
        this.$container.empty().removeClass(this.uid);
    }
});

export default View;