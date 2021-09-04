(function ($) {
    $.viewspy = $.extend(function (elements, options) {
        var viewspy = arguments.callee;
        return new (function monitor(elements, options) {
            var options = $.extend({}, viewspy.defaultOptions, options)
                , nodes = $(elements)
                , lastData = null
                , root = $(options.root)
                , win = $(window);

            var tick = (function tick(f, context) {
                var running = false;
                if (requestAnimationFrame) {
                    return function (e) {
                        if (running) return;
                        running = requestAnimationFrame(function () {
                            f.apply(context, [e]);
                            running = false;
                        });
                    };
                } else {
                    return function (e) {
                        if (running) return;
                        running = setTimeout(function () {
                            f.apply(context, [e]);
                            running = false;
                        }, 1000 / 30);
                    }
                }
            })(function (e) {
                this.update(false);
            }, this);

            this.destroy = function destroy() {
                win.off('resize', tick);
                root.off('scroll', tick);
            };

            this.update = function update(forced) {
                var wy = root[0].scrollTop || root[0].scrollY || 0
                    , wh = root[0].clientHeight || root[0].innerHeight || 0;
                nodes.each(function (i, elem) {
                    var node = $(elem)
                        , y = root[0] == window ? node.offset().top : node.offset().top - root.offset().top + wy
                        , h = elem.offsetHeight || 1;

                    var threshold = Math.min(options.threshold, wh / h);
                    var ratio = (
                        (wy + wh - (y + h * threshold) + options.margin)
                        / (h + wh + (options.margin * 2) - (h * 2 * threshold))
                    );
                    var data = {
                        ratio: ratio,
                        top: y - wy,
                        bottom: wy + wh - y - h,
                        y: y,
                        height: h,
                        state: '',
                        reverse: lastData ? lastData.ratio > ratio : false
                    };

                    if (options.always
                        || !lastData
                        || (ratio > 1 && lastData.ratio <= 1)
                        || (ratio < 0 && lastData.ratio >= 0)
                        || (ratio >= 0 && ratio <= 1)
                        || forced) {
                        if (ratio >= 0 && ratio <= 1) {
                            if (!lastData || lastData.ratio < 0 || lastData.ratio > 1) data.state = 'in';
                        }
                        else if (lastData) {
                            if (lastData.ratio >= 0 && lastData.ratio <= 1) data.state = 'out';
                        }
                        else if (ratio > 1) {
                            data.state = 'out';
                        }

                        node.triggerHandler('viewspy', [data, options]);

                        for (var target in options.parallax) {
                            var transform = options.parallax[target];
                            if (viewspy.parallax[transform]) {
                                viewspy.parallax[transform].apply(node, [$(target, node), data, options]);
                            }
                            else if (typeof (transform == 'function')) {
                                transform.apply(node, [$(target, node), data, options]);
                            }
                        }
                    }
                    lastData = data;
                });
            };

            root.on('scroll', tick);
            win.on('resize', tick);

            win.trigger('resize');
        })(elements, options);
    }, {
        defaultOptions: {
            root: window,
            always: false,
            threshold: 0,
            margin: 0,
            parallax: {}
        },
        parallax: {
            'inner': function (elements, data, options) {
                var r = Math.min(1, Math.max(0, data.ratio));
                $.each(elements, function (i, elem) {
                    elem.style.transform = 'translate3d(0,' + (data.height - elem.offsetHeight) * r + 'px,0)';
                });
            },
            'inner-reverse': function (elements, data, options) {
                var r = Math.min(1, Math.max(0, data.ratio));
                $.each(elements, function (i, elem) {
                    elem.style.transform = 'translate3d(0,' + (data.height - elem.offsetHeight) * (1 - r) + 'px,0)';
                });
            },
            'overflow': function (elements, data, options) {
                var r = Math.min(1, Math.max(0, data.ratio));
                $.each(elements, function (i, elem) {
                    elem.style.transform = 'translate3d(0,' + (r - 0.5) * -100 + '%,0)';
                });
            },
            'overflow-reverse': function (elements, data, options) {
                var r = Math.min(1, Math.max(0, data.ratio));
                $.each(elements, function (i, elem) {
                    elem.style.transform = 'translate3d(0,' + (r - 0.5) * 100 + '%,0)';
                });
            }
        }
    });

    $.fn.viewspy = function (options) {
        if (options === 'destroy') {
            return this.each(function () {
                $.each($.data(this, 'viewspy'), function () {
                    this.destroy();
                });
            }).data('viewspy', null);
        }
        if (options === 'update') {
            return this.each(function () {
                $.each($.data(this, 'viewspy'), function () {
                    this.update(true);
                });
            });
        }
        var spy = $.viewspy(this, options);
        return this.each(function () {
            var a = $.data(this, 'viewspy');
            $.data(this, 'viewspy', a ? a.concat(spy) : [spy]);
        });
    };
})(window.jQuery);