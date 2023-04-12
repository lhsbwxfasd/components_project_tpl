import Common from "../common/index.js"
let EditorBase = Common.events.extend({
    type: "",
    completed: false,
    constructor(option) {
        this.holder = option.holder;
        this.rowData = option.rowData;
        this.colData = option.colData;
        this.initData();
    },
    initData() {
        //init
        this.id = this.colData.id;
        this.dataType = this.colData.dataType;
        //original value
        this.value = this.rowData[this.id] || "";
    },
    updateData(rowData, colData) {
        this.rowData = rowData;
        this.colData = colData;
        this.initData();
        this.updateValue();
    },
    render() {

    },
    focus() {

    },
    updateValue() {

    },
    getValue() {
        return this.value;
    },
    applyValue() {
        let newValue = this.getValue();
        this.rowData[this.colData.id] = newValue;
    },
    isValueChanged() {
        let newValue = this.getValue();
        if (newValue === this.value) {
            return false;
        }
        return true;
    },
    validate(value) {
        return {
            valid: true,
            msg: ""
        };
    },
    commit(e) {
        if (this.completed) {
            return this;
        }
        this.completed = true;
        this.trigger("onCommit", e);
    },
    destroy() {
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
    }
});
export default EditorBase