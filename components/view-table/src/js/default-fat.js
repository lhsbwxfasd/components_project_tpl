export default {
    checkbox(value, rowData, colData, rowIndex, colIndex, cellEl) {
        if (!value) {
            value = ""
        }
        if (!this.isRowSectable(rowData)) {
            return "";
        }
        let html = this.getCheckboxContent(rowData);
        return html;
    },
    multiLevel(value, rowData, colData, rowIndex, colIndex, cellEl) {
        if (!value) {
            value = "--"
        }
        if (colData.linkHost) {
            value = this.fats.linkHost(value, rowData, colData, rowIndex, colIndex, cellEl)
        }
        let html = this.getMultiLevelContent(rowData, value);
        return html;
    },
    string(value, rowData, colData, rowIndex, colIndex, cellEl) {
        if (!value) {
            value = "--"
        }
        if (colData.linkHost) {
            value = this.fats.linkHost(value, rowData, colData, rowIndex, colIndex, cellEl)
        }
        return value;
    },
    number(value, rowData, colData, rowIndex, colIndex, cellEl) {
        if (!value) {
            value = "--"
        }
        return value;
    },

    header(value, rowData, colData, rowIndex, colIndex, cellEl) {
        if (!value) {
            value = ""
        }
        return value;
    },
    title(value, rowData, colData, rowIndex, colIndex, cellEl) {
        if (!value) {
            value = ""
        }
        return value;
    },

    date(value, rowData, colData, rowIndex, colIndex, cellEl) {
        if (!value) {
            value = "--"
        }
        return value;
    },
    icon(value, rowData, colData, rowIndex, colIndex, cellEl) {
        if (!value) {
            value = ""
        }
        return value;
    },

    space(value, rowData, colData, rowIndex, colIndex, cellEl) {
        return "";
    },

    linkHost(value, rowData, colData, rowIndex, colIndex, cellEl) {
        let host = colData.linkHost
        let id = rowData.id || rowData.companyId
        if (host && id) {
            let url = host + "/" + id
            return '<a href="' + url + '" title="' + value + '" target="_blank">' + value + '</a>'
        }
        return value
    },
    link(value, rowData, colData, rowIndex, colIndex, cellEl) {
        if (!value) {
            return ""
        }
        if (value.indexOf("http") !== 0) {
            value = "http://" + value
        }
        return '<a href="' + value + '" title="' + value + '" target="_blank">' + value + '</a>';
    },
    text(value, rowData, columnData, rowIndex, columnIndex, cellNode) {
        if (!value) {
            value = ""
        }
        let editable = this.isCellEditable(rowIndex, columnIndex);
        let domStr = "";
        if (editable) {
            domStr += "<div class='vt-editor-cell-text el-input__inner'>" + value + "</div>";
        } else {
            domStr += "<div class='vt-editor-cell-normal'>" + value + "</div>";
        }
        return domStr;
    },

    list(value, rowData, columnData, rowIndex, columnIndex, cellNode) {
        if (!value) {
            value = ""
        }
        let editable = this.isCellEditable(rowIndex, columnIndex);
        if (editable) {
            let str = '<div class="el-select"><div class="el-input el-input--suffix"><input type="text" value="' + value + '" autocomplete="off" placeholder="请选择" class="el-input__inner" readonly="readonly"><span class="el-input__suffix"><span class="el-input__suffix-inner"><i class="el-select__caret el-input__icon el-icon-arrow-up"></i></span></span></div></div>';
            return str;
        } else {
            return "<div class='vt-editor-cell-normal'>" + value + "</div>";
        }
    }
}