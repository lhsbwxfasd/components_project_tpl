import EditorBase from "./editor-base.js"
let ListEditor = EditorBase.extend({
    type: "list",
    render() {
        if (!this.colData.editorData) {
            console.log("please set editorData")
            return
        }
        let self = this;
        let listOptions = this.colData.editorData;
        let html = "<el-select ref='vt-table-cell-select' v-model='selectData.id' filterable placeholder='请选择' @visible-change='visibleChange'>";
        html += '<el-option v-for="(item, index) in options" :key="index" :label="item.name || item.id" :value="item.id"></el-option>'
        html += "</el-select>";
        this.container = $("<div class='vt-editor-list-container'></div>").appendTo(this.holder);
        this.container.html(html);
        this.selectData = {
            id: this.rowData[this.colData.id],
            name: null
        }
        this.currentSelectListVue = new Vue({
            el: '.vt-editor-list-container',
            data() {
                return {
                    selectData: self.selectData,
                    options: listOptions
                }
            },
            methods: {
                visibleChange(show) {
                    if (!show) {
                        self.commit();
                    }
                }
            }
        });
        this.currentSelectListVue.$refs["vt-table-cell-select"].focus()

        this.trigger("onRendered");
    },

    focus() {

    },
    updateValue() {

    },
    getValue() {
        return this.selectData.id
    },
    validate(value) {
        if (value === "" || value === null) {
            return {
                valid: false,
                msg: "Please choose one"
            };
        }
        return {
            valid: true,
            msg: ""
        };
    },
    destroy() {
        EditorBase.prototype.destroy.apply(this, arguments);
    }
});
export default ListEditor;