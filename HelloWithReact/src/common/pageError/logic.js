var errorHTML = require('common/pageError/tpl')();

module.exports = function(indexPath) {
    var timer = null;
    var that = {};
    clearTimeout(timer);
    var indexURL = indexPath;
    document.body.innerHTML = errorHTML || '';
    if (window.location.href.indexOf(indexURL) === -1) {
        timer = setTimeout(function() {
            window.location.href = indexPath;
        }, 3000);
    }

    function destroy() {
        clearTimeout(timer);
    }

    that.destroy = destroy;
    that.timer = timer;

    return that;
};
