import EditorBase from "./editor-base.js"
let TextEditor = EditorBase.extend({
    type: "text",
    render() {
        this.container = $("<div class='vt-editor-text-container'></div>").appendTo(this.holder);
        this.$input = $("<input type='text' class='vt-editor-text el-input__inner' />").appendTo(this.container);
        if (this.colData.align) {
            this.$input.addClass("vt-align-" + this.colData.align);
        }
        let self = this;
        this.$input.bind("keydown", (e) => {
            if (e.keyCode === 37 || e.keyCode === 39) {
                e.stopImmediatePropagation();
            }
        }).bind("keyup", (e) => {
            self.trigger("onChanging", e);
        }).bind("blur", (e) => {
            self.commit(e);
        });
        this.focus();
        this.updateValue();
        this.$input.select();
        this.trigger("onRendered");
    },

    focus() {
        this.$input.focus();
    },

    updateValue() {
        this.$input.val(this.value);
    },

    getValue() {
        let value = this.$input.val();
        if (this.dataType === "number") {
            if (value) {
                value = Number(value);
            }
        }
        return value;
    },

    validate(value) {
        if (this.dataType === "number") {
            if (typeof(value) !== "number" || isNaN(value)) {
                return {
                    valid: false,
                    msg: "Please enter a valid number"
                };
            }
        }
        return {
            valid: true,
            msg: ""
        };
    },
    destroy() {
        this.$input.remove();
        EditorBase.prototype.destroy.apply(this, arguments);
    }
});

export default TextEditor;