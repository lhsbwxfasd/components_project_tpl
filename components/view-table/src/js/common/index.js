let $ = window["jQuery"] || require("jquery")
import "jquery.mousewheel"
import scrollbarTemplate from "./scroll-bar.html"
import "./css.scss"
let indicatorPercent = {
    "IntervalReturn": true,
    "RangeReturn":true,
    "AnnualReturn":true,
    "AnnualReturnAlg":true,
    "AnnualStdDev":true,
    "DownsideStdDev":true,
    "UpCaptureReturn":true,
    "DownCaptureReturn":true,
    "Alpha":true,
    "TrackingError":true,
    "M2":true,
    "Jensen":true,
    "MaxDrawdown":true,
    "HistoricalVaR":true,
    "HistoricalCVaR":true,
    "SMDDVaR":true,
    "SMDDCVaR":true,
    "SMDDLPM1":true,
    "SMDDLPM2":true,
    "DownsideDeviation":true,
    "WinRate":true
}

function indicatorFat(value, type, decimals) {
    if(!value) {
        return value
    }
    let fatV = value
    if(typeof(fatV) != "number") {
        fatV = Number(fatV)
    }
    if(isNaN(fatV)) {
        return value
    }
    if(indicatorPercent[type]) {
        fatV = fatV * 100
    }
    if(decimals >= 0) {
        let power = Math.pow(10, decimals)
        fatV = fatV * power + 0.5
        fatV = parseInt(fatV, 10) / power
    }
    return fatV
}

function isObject(obj) {
    if (!obj || typeof(obj) !== "object" || typeof(obj.constructor) !== "function") {
        return false;
    }
    if (obj.constructor === Array || obj.constructor === Object) {
        return true;
    }
    return false;
}

function merge() {
    let arg = arguments;
    let len = arg.length;
    if (!len) {
        return {};
    }
    let deep = true;
    if (arg[len - 1] === false) {
        deep = false;
    }
    let merge_arr = function(arr, result) {
        let len = arr.length;
        for (let i = 0; i < len; i++) {
            let item = arr[i];
            if (deep && isObject(item)) {
                result[i] = merge(result[i], item);
            } else {
                result[i] = item;
            }
        }
        result.length = len;
    };
    let merge_obj = function(item, result) {
        Object.keys(item).forEach((n) => {
            let v = item[n];
            if (result.hasOwnProperty(n) && deep && isObject(v)) {
                result[n] = merge(result[n], v);
            } else {
                result[n] = v;
            }
        });
    };
    let do_merge = function() {
        let result = null;
        for (let i = 0; i < len; i++) {
            let item = arg[i];
            if (!isObject(item)) {
                continue;
            }
            if (result === null) {
                result = (item instanceof Array) ? [] : {};
            }
            if (item instanceof Array) {
                merge_arr(item, result);
            } else {
                merge_obj(item, result);
            }
        }
        return result;
    };
    let result = do_merge();
    return result;
}


//Property
function MergeObj(obj, arr) {
    for (let i = 0, l = arr.length; i < l; i++) {
        let item = arr[i];
        if (!item) {
            continue;
        }
        for (let k in item) {
            if (obj[k] !== item[k]) {
                obj[k] = item[k];
            }
        }
    }
    return obj;
}

function Property() {};
Property.extend = function(objPropertys) {
    let self = this;

    function child() {
        return self.apply(this, arguments);
    }
    if (objPropertys && objPropertys.hasOwnProperty("constructor") && typeof(objPropertys.constructor) === 'function') {
        child = objPropertys.constructor;
    }
    MergeObj(child, [self]);
    let parentProps = Object.create(self.prototype);
    parentProps.constructor = child;
    MergeObj(child.prototype, [parentProps, objPropertys]);
    return child;
}
Property.mixin = function() {
    let objPropertys = MergeObj({}, arguments);
    return Property.extend.call(this, objPropertys);
}


//Evt
let Evt = function(o) {
    this.type = o.type;
    this.data = o.data;
    this.target = o.target;
    this.currentTarget = o.target;
    this.delegateTarget = o.target;
}

Evt.prototype = {
    constructor: Evt,
    isPrevented: false,
    isStopped: false,
    isImmediateStopped: false,
    prevented() {
        this.isPrevented = true;
    },
    stopped() {
        this.isStopped = true;
    },
    stopImmediated() {
        this.isImmediateStopped = true;
        this.stopped();
    }
}

function getEvt(cxt, fn, opt) {
    cxt += "";
    if (!cxt) {
        return null;
    }
    opt = opt || {};
    let arr = cxt.split(".");
    let type = arr.shift();
    let evt = {
        cxt: cxt,
        type: type,
        fn: fn
    };
    return evt;
}

function getEvts(types, fn, opt) {
    if (!types) {
        return [];
    }

    if (fn && typeof(fn) === "object") {
        opt = fn;
    }
    let list = [];
    if (typeof(types) === "object") {
        let keys = Object.keys(types);
        keys.forEach((type) => {
            let evt = getEvt(type, types[type], opt);
            if (evt) {
                list.push(evt);
            }
        });
        return list;
    }

    if (typeof(types) === "string") {
        let arr = types.split(" ");
        arr.forEach((type) => {
            let evt = getEvt(type, fn, opt);
            if (evt) {
                list.push(evt);
            }
        });
    }
    return list;
}

function addEvt(monitor, evt) {
    monitor.evts.push(evt);
}

function addEvts(monitors, evts) {
    evts.forEach(function(evt) {
        let type = evt.type;
        if (typeof(monitors[type]) === "undefined") {
            monitors[type] = {
                evts: []
            };
        }
        let fn = evt.fn;
        if (typeof(fn) !== "function") {
            return;
        }
        let monitor = monitors[type];
        addEvt(monitor, evt);
    });
}

function removeEvt(monitors, type) {
    let monitor = monitors[type];
    if (!monitor) {
        return;
    }
    delete monitors[type];
}

function removeEvts(monitors, evts) {
    evts.forEach((evt) => {
        removeEvt(monitors, evt.type);
    });
}

function removeAllEvts(monitors) {
    let types = Object.keys(monitors);
    types.forEach((type) => {
        removeEvt(monitors, type);
    });
}

function sendEvts(monitor, evt, target, data) {
    let evts = monitor.evts;
    for (let i = 0; i < evts.length; i++) {
        let item = evts[i];
        item.fn.call(target, evt, data);
        if (evt.isStopped) {
            break;
        }
    }
}

function sendEvt(monitors, type, data, target) {
    let monitor = monitors[type];
    if (!monitor) {
        return;
    }
    let evt = new Evt({
        type: type,
        target: target,
        data: data
    });
    sendEvts(monitor, evt, target, data);
}

let EvtModule = Property.extend({
    getMonitors() {
        if (!this.monitors) {
            this.monitors = {};
        }
        return this.monitors;
    },
    bind(t, fn, opt) {
        let evts = getEvts(t, fn, opt);
        if (!evts.length) {
            return this;
        }
        let monitors = this.getMonitors();
        addEvts(monitors, evts);
        return this;
    },

    unbind(t, fn, opt) {
        let monitors = this.getMonitors();
        if (!arguments.length) {
            removeAllEvts(monitors);
            return this;
        }
        let evts = getEvts(t, fn, opt);
        if (!evts.length) {
            return this;
        }
        removeEvts(monitors, evts);
        return this;
    },

    trigger(t, d) {
        let monitors = this.getMonitors();
        sendEvt(monitors, t, d, this);
        return this;
    }
});

//drag
let DragMoudle = EvtModule.extend({
    isDragging: false,
    _setOpt() {
        this.opt = {
            mouseStartX: 0,
            mouseStartY: 0,
            mousePrevX: 0,
            mousePrevY: 0,
            mouseCurX: 0,
            mouseCurY: 0,
            mouseOffsetX: 0,
            mouseOffsetY: 0,
            mouseMoveX: 0,
            mouseMoveY: 0,
            valid: false,
            state: null
        };
    },
    constructor() {
        this.init();
    },
    init() {
        this.eventNameSpace = ".drag_" + random(8);
        this.mousemove = "mousemove" + this.eventNameSpace;
        this.mouseup = "mouseup" + this.eventNameSpace;
        this._setOpt();
        return this;
    },
    setOpt(opt) {
        let o = this.opt;
        Object.keys(opt).forEach(function(k) {
            o[k] = opt[k];
        });
        return this;
    },

    updateOpt(e) {
        if (!e) {
            return;
        }
        let o = this.opt;
        o.mousePrevX = o.mouseCurX;
        o.mousePrevY = o.mouseCurY;
        o.mouseCurX = e.pageX;
        o.mouseCurY = e.pageY;
        o.mouseOffsetX = o.mouseCurX - o.mouseStartX;
        o.mouseOffsetY = o.mouseCurY - o.mouseStartY;
        o.valid = (o.mouseOffsetX === 0 && o.mouseOffsetY === 0) ? false : true;
        o.mouseMoveX = o.mouseCurX - o.mousePrevX;
        o.mouseMoveY = o.mouseCurY - o.mousePrevY;
        return this;
    },

    start(opt) {
        this.handlePrev();
        this._setOpt();
        this.setOpt(opt);
        let o = this.opt;
        if (!o.e) {
            return this;
        }
        if (!o.target) {
            o.target = $(o.e.currentTarget);
        }
        let holder = $(window);
        holder.unbind(this.eventNameSpace);
        let self = this;
        holder.one(this.mouseup, function(e) {
            holder.unbind(self.eventNameSpace);
            self.handleDragComplete(e);
        });
        holder.bind(this.mousemove, function(e) {
            self.handleDragUpdate(e);
        });
        this.handleDragInit(o.e);
        return this;
    },

    handlePrev() {
        let o = this.opt;
        if (o.valid && o.state !== "dragcomplete") {
            this.handleDragComplete();
        }
    },

    prevented(e) {
        if (e && e.preventDefault) {
            e.preventDefault();
        }
    },

    handleDragInit(e) {
        let o = this.opt;
        o.mouseStartX = e.pageX;
        o.mouseStartY = e.pageY;
        o.mouseCurX = o.mouseStartX;
        o.mouseCurY = o.mouseStartY;
        o.valid = false;
        this.isDragging = false;
        this.prevented(e);
        o.state = "draginit";
        this.trigger("draginit", o);
        return this;
    },

    handleDragUpdate(e) {
        this.updateOpt(e);
        let o = this.opt;
        if (o.state === "dragstart" || o.state === "dragupdate") {
            this.prevented(e);
            o.state = "dragupdate";
            this.trigger("dragupdate", o);
            return this;
        }

        if (!o.valid) {
            return this;
        }

        this.isDragging = true;
        this.prevented(e);
        o.state = "dragstart";
        this.trigger("dragstart", o);
        return this;
    },

    handleDragComplete(e) {
        this.updateOpt(e);
        let o = this.opt;
        this.isDragging = false;
        this.prevented(e);
        o.state = "dragcomplete";
        this.trigger("dragcomplete", o);
        return this;
    }
});

//opts
let OptsModule = EvtModule.extend({
    opt: null,
    _opt() {
        return {};
    },
    setOpt() {
        this.opt = this.getOpt.apply(this, arguments);
        return this;
    },
    getOpt() {
        let opt = this.opt;
        let _opt = this._opt();
        if (arguments.length && arguments[0]) {
            let newOpt = arguments[0];
            if (arguments[1]) {
                _opt = this.opt;
            }
            opt = merge(_opt, newOpt);
        }
        return opt || _opt;
    }
});

//scrollbar
let ScrollBarModule = OptsModule.extend({
    mode: "h",
    type: {
        className: "cm-scrollbar-h",
        offset: "left",
        page: "pageX",
        mouseOffset: "mouseOffsetX"
    },
    size: 0,
    viewSize: 0,
    bodySize: 0,
    position: 0,
    scale: 0,
    thumbPosition: 0,
    thumbScale: 0,
    constructor(holder) {
        this.opt = this._opt();
        this.holder = $(holder);
        this.holder.find("." + this.type.className).remove();
    },
    _opt() {
        return {
            size: 15,
            space: false
        };
    },
    create() {
        this.container = $(scrollbarTemplate).appendTo(this.holder);
        this.container.addClass("cm-scrollbar " + this.type.className);
        this.track = this.container.find(".cm-scrollbar-track");
        this.thumb = this.container.find(".cm-scrollbar-thumb");
        let self = this;
        this.track.bind("sectstart", function(e) {
            return false;
        }).bind("mousedown", function(e) {
            self.trigger("onFocus", e);
            self.trackMousedown(e);
            $(window).one("mouseup", function(e) {
                self.trackMouseup(e);
            });
            return false;
        });
        this.thumbDrag = new DragMoudle();
        this.thumbDrag.bind("dragstart", function(e, d) {
            self.thumbDragStart(d);
        }).bind("dragupdate", function(e, d) {
            self.thumbDragUpdate(d);
        }).bind("dragcomplete", function(e, d) {
            self.thumbDragComplete(d);
        });
        this.thumb.bind("sectstart", function(e) {
            return false;
        }).bind("mousedown", function(e) {
            self.trigger("onFocus", e);
            self.thumbDragInit(e);
        });
        return this;
    },
    getSpace() {
        return this.opt.space;
    },
    getSize() {
        return this.size;
    },
    getViewSize() {
        return this.viewSize;
    },
    getBodySize() {
        return this.bodySize;
    },
    getTrackMouseDirection() {
        let direction = 1;
        if (this.trackMousePosition < this.thumbPosition) {
            direction = -1;
        }
        return direction;
    },

    getTrackMousePosition(e) {
        let offset = this.track.offset();
        let mousePosition = e[this.type.page] - offset[this.type.offset];
        return mousePosition;
    },
    getMaxThumbPosition() {
        let maxThumbPosition = this.viewSize - this.thumbSize;
        return maxThumbPosition;
    },
    setThumbPosition(thumbPosition) {
        if (thumbPosition === this.thumbPosition) {
            return this;
        }
        this.thumbPosition = thumbPosition;
        if (this.thumb) {
            this.thumb.css(this.type.offset, thumbPosition);
        }
        return this;
    },
    updateThumbPosition() {
        let thumbPosition = 0;
        let maxPosition = this.getMaxPosition();
        if (maxPosition > 0) {
            let maxThumbPosition = this.getMaxThumbPosition();
            thumbPosition = Math.round(maxThumbPosition * this.position / maxPosition);
            thumbPosition = maxmin(thumbPosition, 0, maxThumbPosition);
        }
        this.setThumbPosition(thumbPosition);
        return this;
    },
    trackMousedown(e) {
        this.trackMousePosition = this.getTrackMousePosition(e);
        return this;
    },
    trackMouseup(e) {
        this.trackMousePosition = this.getTrackMousePosition(e);
        this.trackScroll();
        this.triggerEvent();
        return this;
    },

    trackScroll() {
        let viewSize = Math.max(0, this.viewSize - 20);
        let direction = this.getTrackMouseDirection();
        let offset = viewSize * direction;
        this.setOffset(offset);
        return this;
    },
    thumbDragInit(e) {
        this.thumb.addClass("cm-scrollbar-thumb-hold");
        this.thumbDrag.start({
            e: e,
            target: this.thumb
        });
    },
    thumbDragStart(d) {
        d.thumbPositionStart = this.thumbPosition;
    },
    thumbDragUpdate(d) {
        let thumbPosition = d.thumbPositionStart + d[this.type.mouseOffset];
        let maxThumbPosition = this.getMaxThumbPosition();
        thumbPosition = maxmin(thumbPosition, 0, maxThumbPosition);
        this.setThumbPosition(thumbPosition);
        let newPosition = 0;
        if (maxThumbPosition > 0) {
            newPosition = percentNum(thumbPosition / maxThumbPosition) * this.getMaxPosition();
            newPosition = Math.round(newPosition);
        }
        this.position = newPosition;
        this.triggerEvent();
    },

    thumbDragComplete(d) {
        this.thumb.removeClass("cm-scrollbar-thumb-hold");
    },
    triggerEvent() {
        this.trigger("onChange", this.position);
    },
    getPosition() {
        return this.position;
    },
    setPosition(position) {
        position = toNumber(position, true);
        let maxPosition = this.getMaxPosition();
        position = maxmin(position, 0, maxPosition);
        this.position = position;
        this.updateThumbPosition();
    },
    getMaxPosition() {
        let maxPosition = this.bodySize - this.viewSize;
        return maxPosition;
    },
    updatePosition() {
        let maxPosition = this.getMaxPosition();
        let position = maxmin(this.position, 0, maxPosition);
        this.position = position;
    },
    setOffset(offset) {
        offset = toNumber(offset);
        let position = this.position + offset;
        this.setPosition(position);
        return this;
    },
    getScale() {
        return this.scale;
    },
    setScale(scale) {
        scale = percentNum(scale);
        this.scale = scale;
        this.handleScaleChange();
        return this;
    },
    handleScaleChange() {
        let thumbSize = Math.round(this.viewSize * this.scale);
        thumbSize = Math.max(thumbSize, this.opt.size);
        thumbSize = Math.min(thumbSize, this.viewSize);
        thumbSize = Math.max(thumbSize, 25);
        this.thumbSize = thumbSize;
        if (this.thumb) {
            let thumbData = {};
            if (this.mode === "h") {
                thumbData.height = this.size;
                thumbData.width = this.thumbSize;
            } else {
                thumbData.width = this.size;
                thumbData.height = this.thumbSize;
            }
            this.thumb.css(thumbData);
        }
    },
    updateTrackSize() {
        let track = {};
        if (this.mode === "h") {
            track.width = this.viewSize;
            track.height = this.size;
        } else {
            track.height = this.viewSize;
            track.width = this.size;
        }
        this.container.css(track);
        return this;
    },
    updateThumbSize() {
        let scale = 0;
        if (this.bodySize) {
            scale = this.viewSize / this.bodySize;
        }
        this.setScale(scale);
        return this;
    },
    updateOpt(opt) {
        this.setOpt(opt);
        let size = this.opt.size;
        if (!isNumber(size)) {
            size = toNumber(size);
        }
        size = Math.round(size);
        size = Math.max(size, 0);
        size = Math.min(size, 30);
        this.size = size;
        return;
    },
    updateSize(viewSize, bodySize) {
        if (!isNumber(viewSize)) {
            viewSize = toNumber(viewSize);
        }
        viewSize = Math.round(viewSize);
        viewSize = Math.max(viewSize, 0);
        this.viewSize = viewSize;
        if (!isNumber(bodySize)) {
            bodySize = toNumber(bodySize);
        }
        bodySize = Math.round(bodySize);
        bodySize = Math.max(bodySize, 0);
        this.bodySize = bodySize;
    },
    show() {
        this.updatePosition();
        if (this.getSpace()) {
            this.remove();
            return;
        }
        if (!this.container && this.size > 0) {
            this.create();
        }
        if (!this.container) {
            return this;
        }
        this.updateTrackSize();
        this.updateThumbSize();
        return this;
    },
    hide() {
        this.updatePosition();
        this.remove();
        return this;
    },
    remove() {
        if (!this.container) {
            return this;
        }
        this.thumb.unbind();
        this.thumb = null;
        this.track.unbind();
        this.track = null;
        this.container.unbind();
        this.container.remove();
        this.container = null;
    },
    destroy() {
        removeTimeout(this);
        this.remove();
        this.unbind();
        return this;
    }
});

let ScrollBarVModule = ScrollBarModule.extend({
    mode: "v",
    type: {
        className: "cm-scrollbar-v",
        offset: "top",
        size: "height",
        page: "pageY",
        axis: "y",
        mouseOffset: "mouseOffsetY"
    }
});

//scroll
let ScrollModule = OptsModule.extend({
    visible: true,
    scrollTopOffset: 0,
    _opt() {
        return {
            scrollW: 0,
            scrollH: 0,
            scrollBodyW: 0,
            scrollBodyH: 0,
            scrollBarH: {
                size: 0,
                space: false
            },
            scrollBarV: {
                size: 0,
                space: false
            },
            event: false,
            wheelDirection: -1,
            wheelSizeH: 10,
            wheelSizeV: 27
        };
    },
    constructor(container) {
        this.opt = this._opt();
        this.container = $(container);
        this.init();
    },
    initContainer() {
        this.container.addClass("cm-scroll");
        this.scroll = this.container;
        let $scrollview = this.scroll.find(".cm-scroll-view");
        if (!$scrollview.length) {
            $scrollview = $("<div></div>").addClass("cm-scroll-view").appendTo(this.scroll);
        }
        this.scrollview = $scrollview.get(0);
        let $scrollBody = $scrollview.find(".cm-scroll-body");
        if (!$scrollBody.length) {
            $scrollBody = $("<div></div>").addClass("cm-scroll-body").appendTo($scrollview);
        }
        this.scrollBody = $scrollBody.get(0);
    },
    init() {
        this.initContainer();
        let self = this;
        this.scroll.bind("mousewheel", function(e) {

            if (self.opt.event) {
                self.handleMousewheel(e);
            }

        });
        this.scrollBarH = new ScrollBarModule(this.container);
        this.scrollBarH.bind("onFocus", function(e, d) {
            self.handleScrollbarFocus(e, d);
        }).bind("onChange", function(e, d) {
            self.handleScrollHChange();
        });
        this.scrollBarV = new ScrollBarVModule(this.container);
        this.scrollBarV.bind("onFocus", function(e, d) {
            self.handleScrollbarFocus(e, d);
        }).bind("onChange", function(e, d) {
            self.handleScrollVChange();
        });

        return this;
    },
    show() {
        if (this.visible) {
            return this;
        }
        this.scroll.show();
        this.visible = true;
        return this;
    },
    hide() {
        if (!this.visible) {
            return this;
        }
        this.scroll.hide();
        this.visible = false;
        return this;
    },
    width() {
        return this.scrollW;
    },
    height() {
        return this.scrollH;
    },
    setFocus() {
        this.scroll.focus();
        return this;
    },
    handleScrollbarFocus(e, d) {
        //this.setFocus();
        return this
    },
    render(opt) {
        if (opt) {
            this.setOpt(opt);
        }
        this.update();
        return this;
    },
    update() {
        this.scrollW = this.opt.scrollW;
        this.scrollH = this.opt.scrollH;
        this.scrollBodyW = this.opt.scrollBodyW;
        this.scrollBodyH = this.opt.scrollBodyH;
        this.updateScrollBar();
    },

    //horiz
    setHorizScrollList(scrollList) {
        this.horizScrollList = toArray(scrollList);
    },
    //vertical
    setVerticalScrollList(scrollList) {
        this.verticalScrollList = toArray(scrollList);
    },
    updateGroupH() {
        if (!isArray(this.horizScrollList)) {
            return this;
        }
        let positionH = this.scrollBarH.getPosition();
        this.horizScrollList.forEach(function(scroll) {
            if (!scroll) {
                return;
            }
            scroll.updateScrollH(positionH);
        });
        return this;
    },
    updateGroupV() {
        if (!isArray(this.verticalScrollList)) {
            return this;
        }
        let positionV = this.scrollBarV.getPosition();
        this.verticalScrollList.forEach(function(scroll) {
            if (!scroll) {
                return;
            }
            scroll.updateScrollV(positionV);
        });
        return this;
    },
    updateGroupList() {
        this.updateGroupH();
        this.updateGroupV();
    },
    updateScrollH(positionH) {
        let posH = this.scrollBarH.getPosition();
        if (posH === positionH) {
            return;
        }
        this.scrollBarH.setPosition(positionH);
        this.updateScrollLeft();
        this.triggerEvent();
    },
    updateScrollV(positionV) {
        let posV = this.scrollBarV.getPosition();
        if (posV === positionV) {
            return;
        }
        this.scrollBarV.setPosition(positionV);
        this.updateScrollTop();
        this.triggerEvent();
    },
    setPosition(scrollLeft, scrollTop) {
        this.scrollBarH.setPosition(scrollLeft);
        this.scrollBarV.setPosition(scrollTop);

        this.updateScrollLeft();
        this.updateScrollTop();

        this.updateGroupList();

        return this;
    },
    updateScrollBar() {
        this.scrollBarH.updateOpt(this.opt.scrollBarH);
        this.scrollBarV.updateOpt(this.opt.scrollBarV);
        this.updateScrollStatus();
        this.scrollBarH.updateSize(this.scrollviewW, this.scrollBodyW);
        this.scrollBarV.updateSize(this.scrollviewH, this.scrollBodyH);
        if (this.scrollVisibleH) {
            this.scrollBarH.show();
            this.scrollBarH.setPosition(this.scrollBarH.getPosition());
        } else {
            this.scrollBarH.hide();
        }
        if (this.scrollVisibleV) {
            this.scrollBarV.show();
            this.scrollBarV.setPosition(this.scrollBarV.getPosition());
        } else {
            this.scrollBarV.hide();
        }
        this.updateScrollLeft();
        this.updateScrollTop();
        this.updateGroupList();
    },
    updateScrollStatus() {
        let scrollbarSizeH = this.scrollBarH.getSize();
        let scrollbarSizeV = this.scrollBarV.getSize();
        let spaceH = this.scrollBarH.getSpace();
        let spaceV = this.scrollBarV.getSpace();
        let scrollVisibleH = false;
        let scrollSizeH = 0;
        let scrollHStatusHandler = function() {
            if (this.scrollW < this.scrollBodyW || spaceH) {
                scrollVisibleH = true;
                scrollSizeH = scrollbarSizeH;
            }
        };
        scrollHStatusHandler.call(this);
        let scrollVisibleV = false;
        let scrollSizeV = 0;
        let scrollVStatusHandler = function() {
            if (this.scrollH < this.scrollBodyH + scrollSizeH || spaceV) {
                scrollVisibleV = true;
                scrollSizeV = scrollbarSizeV;
                if (!scrollVisibleH) {
                    if (this.scrollW < this.scrollBodyW + scrollSizeV) {
                        scrollVisibleH = true;
                        scrollSizeH = scrollbarSizeH;
                    }
                }
            }
        };
        scrollVStatusHandler.call(this);
        this.scrollVisibleH = scrollVisibleH;
        this.scrollVisibleV = scrollVisibleV;
        this.scrollSizeH = scrollSizeH;
        this.scrollSizeV = scrollSizeV;
        this.updateScrollView(spaceH, spaceV);
        return this;
    },
    updateScrollView(spaceH, spaceV) {
        this.scrollviewW = this.scrollW;
        if (this.scrollVisibleV) {
            this.scrollviewW = this.scrollW - this.scrollSizeV;
        }
        this.scrollviewH = this.scrollH;
        if (this.scrollVisibleH) {
            this.scrollviewH = this.scrollH - this.scrollSizeH;
        }
        let width = this.scrollviewW;
        if (spaceV && spaceV !== true) {
            width = this.scrollW;
        }

        let height = this.scrollviewH;
        if (spaceH && spaceH !== true) {
            height = this.scrollH;
        }

        this.scrollview.style.width = width + "px";
        this.scrollview.style.height = height + "px";
        return this;
    },
    updateScrollLeft() {
        let scrollLeft = this.getScrollLeft();
        this.scrollBody.style.left = -scrollLeft + "px";
        return this;
    },
    updateScrollTop() {
        let scrollTop = this.getScrollTop();
        let scrollTopOffset = this.getScrollTopOffset();
        let top = scrollTop - scrollTopOffset;
        this.scrollBody.style.top = -top + "px";
        return this;
    },
    getScrollLeft() {
        let scrollLeft = this.scrollBarH.getPosition();
        return scrollLeft;
    },
    getScrollTop() {
        let scrollTop = this.scrollBarV.getPosition();
        return scrollTop;
    },
    getScrollTopOffset() {
        let scrollTop = this.getScrollTop();
        //max size, bigger than 8K screen
        let top = scrollTop % 10000;
        let scrollTopOffset = scrollTop - top;
        return scrollTopOffset;
    },
    triggerEvent() {
        this.trigger("onChange", {
            scrollLeft: this.getScrollLeft(),
            scrollTop: this.getScrollTop(),
            scrollTopOffset: this.getScrollTopOffset()
        });
    },
    handleScrollHChange() {
        this.updateScrollLeft();
        this.updateGroupList();
        this.triggerEvent();
    },
    handleScrollVChange() {
        this.updateScrollTop();
        this.updateGroupList();
        this.triggerEvent();
    },
    handleMousewheel(e) {
        if (!e) {
            return;
        }
        if (!isNumber(e.deltaX) || !isNumber(e.deltaY)) {
            return;
        }
        //e.preventDefault();
        let deltaX = e.deltaX;
        let deltaY = e.deltaY;
        this.updateMouseWheel(deltaX, deltaY);
    },
    updateMouseWheel(deltaX, deltaY) {
        let dx = Math.abs(deltaX);
        let dy = Math.abs(deltaY);
        if (dx > dy) {
            if (this.scrollVisibleH) {
                this.updateMouseWheelH(deltaX);
            }
        } else {
            if (this.scrollVisibleV) {
                this.updateMouseWheelV(deltaY);
            }
        }
        return this;
    },
    updateMouseWheelH(d) {
        let offset = d * this.opt.wheelSizeH * this.opt.wheelDirection;
        this.scrollBarH.setOffset(offset);
        this.updateScrollLeft();
        this.updateGroupList();
        this.triggerEvent();
        return this;
    },
    updateMouseWheelV(d) {
        let offset = d * this.opt.wheelSizeV * this.opt.wheelDirection;
        this.scrollBarV.setOffset(offset);
        this.updateScrollTop();
        this.updateGroupList();
        this.triggerEvent();
        return this;
    },
    destroy() {
        removeTimeout(this);
        this.horizScrollList = null;
        this.verticalScrollList = null;
        this.unbind();
        this.scrollBarV.destroy();
        this.scrollBarV = null;
        this.scrollBarH.destroy();
        this.scrollBarH = null;
        this.scroll.unbind();
        this.scroll = null;
        this.scrollview = null;
        this.scrollBody = null;
        this.container = null;
        return this;
    }
});

let CustomScroll = function($container, $scrollBody, scrollBarWidth) {
    this.scrollBarWidth = scrollBarWidth || 4
    this.$container = $container
    this.$scrollBody = $scrollBody
    if(!$container || !$scrollBody) {
        return
    }
    this.init($container, $scrollBody)
}
CustomScroll.prototype = {
    init($container, $scrollBody) {
        this.scroll = new ScrollModule($container)
        this.scroll.updateScrollLeft = function() {}
        this.scroll.updateScrollTop = function() {}
        $container.bind("mousewheel", (e) => {
          this.scroll.handleMousewheel(e)
          if($container.find(".cm-scrollbar-v").length > 0) {
            e.preventDefault()
            e.stopPropagation()
          }
        })
        this.scroll.bind("onChange", (e, d) => {
          $scrollBody.scrollTop = d.scrollTop
        })
        this.resize()
        $(window).resize(() => {
            if(window.requestAnimationFrame) {
                window.requestAnimationFrame(() => {
                    this.resize()
                })
            } else {
                this.resize()
            }
        })
    },
    resize() {
        this.scroll.render({
          scrollW: "100%",
          scrollH: Math.ceil(this.$container.outerHeight()),
          scrollBodyW: "100%",
          scrollBodyH: this.$scrollBody.scrollHeight,
          scrollBarV: {
            size: this.scrollBarWidth
          }
        })
    }
}

//tools
let uniqValue = 0;

function uniq(len) {
    uniqValue += 1;
    let t = random(len);
    return t + uniqValue;
}

function random(len) {
    let str = Math.random().toString().substr(2);
    if (len) {
        str = str.substr(0, toNumber(len));
    }
    return str;
}

function isNumber(num) {
    if (typeof(num) !== "number" || isNaN(num)) {
        return false;
    }
    let isInvalid = function(n) {
        if (n === Number.MAX_VALUE || n === Number.MIN_VALUE || n === Number.NEGATIVE_INFINITY || n === Number.POSITIVE_INFINITY) {
            return true;
        }
        return false;
    };
    if (isInvalid(num)) {
        return false;
    }
    return true;
}

function toNumber(num, toInt) {
    if (typeof(num) !== "number") {
        num = parseFloat(num);
    }
    if (isNaN(num)) {
        num = 0;
    }
    if (toInt) {
        num = Math.round(num);
    }
    return num;
}

function maxmin(num, min, max) {
    return Math.max(Math.min(num, max), min);
}

function percentNum(num) {
    num = toNumber(num);
    num = maxmin(num, 0, 1);
    return num;
}

function replace(str, obj) {
    str = "" + str;
    if (!obj) {
        return str;
    }
    str = str.replace(/\{([^\}]+)\}/g, function(match, key) {
        if (!obj.hasOwnProperty(key)) {
            return match;
        }
        return obj[key];
    });
    return str;
}

function isArray(data) {
    if (data && data instanceof Array) {
        return true;
    }
    return false;
}

function toArray(data) {
    if (!data) {
        return [];
    }
    if (data instanceof Array) {
        return data;
    }
    return [data];
}

function inArray(item, list) {
    if (!isArray(list)) {
        return false;
    }
    for (let i = 0, l = list.length; i < l; i++) {
        if (list[i] === item) {
            return true;
        }
    }
    return false;
}

function listToMap(list) {
    let map = {};
    if (isArray(list)) {
        list.forEach(function(item) {
            map[item] = true;
        });
    }
    return map;
}

function isDate(date) {
    if (!date || !(date instanceof Date)) {
        return false;
    }
    if (isNaN(date.getTime())) {
        return false;
    }
    return true;
}


function getValue(data, path, defaultValue) {
    /*example: getValue({a:{b:1}}, "a.b", 0)*/
    if (!path) {
        return defaultValue;
    }
    let current = data;
    let list = path.split(".");
    let lastKey = list.pop();
    while (current && list.length) {
        let item = list.shift();
        current = current[item];
    }
    if (current && current.hasOwnProperty(lastKey)) {
        let value = current[lastKey];
        if (typeof(value) !== "undefined") {
            return value;
        }
    }
    return defaultValue;
}

function isMatch(item, attr) {
    if (!item || !attr) {
        return false;
    }
    for (let k in attr) {
        if (item[k] !== attr[k]) {
            return false;
        }
    }
    return true;
}

function getListItem(list, attr) {
    if (isArray(list)) {
        for (let i = 0, l = list.length; i < l; i++) {
            let item = list[i];
            if (isMatch(item, attr)) {
                return item;
            }
        }
    }
    return null;
}

function delListItem(list, attr) {
    if (!isArray(list)) {
        return list;
    }
    for (let i = 0; i < list.length; i++) {
        let item = list[i];
        if (isMatch(item, attr)) {
            list.splice(i, 1);
            i--;
        }
    }
    return list;
}

function removeTimeout(target) {
    if (!target) {
        return;
    }
    for (var key in target) {
        if (key.indexOf("timeout_") === 0 && typeof(target[key]) === "number") {
            clearTimeout(target[key]);
        }
    }
}





//export
let Common = {
    property: EvtModule,
    events: EvtModule,
    drag: DragMoudle,
    opts: OptsModule,
    scrollBar: ScrollBarModule,
    scrollBarH: ScrollBarModule,
    scrollBarV: ScrollBarVModule,
    scroll: ScrollModule,
    customScroll: CustomScroll,
    indicatorFat,
    merge,
    uniq,
    random,
    isNumber,
    toNumber,
    maxmin,
    percentNum,
    replace,
    isArray,
    toArray,
    inArray,
    listToMap,
    isDate,
    getValue,
    isMatch,
    getListItem,
    delListItem
}
window["common"] = Common
export default Common