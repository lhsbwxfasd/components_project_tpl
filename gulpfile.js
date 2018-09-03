/*
    @auther 李华 2018
*/
let gulp = require('gulp')
let minimist = require('minimist')
let config = require('./gulp.config.js')
let shelljs = require('shelljs')
let envirionment = minimist(process.argv.slice(2))

let componentsPath = './components/'
let projectName = envirionment.n
let projectPath = componentsPath + projectName
let projectEntryJs = projectPath + "/**/index.js"
let projectJs = projectPath + "/src/**/*.js"
let outDist = componentsPath + projectName + "/dist"
let tasks = config.task
gulp.task('default', ['clean', 'complieJs', 'server', 'watcher', 'openBrowser'])
//gulp.task('default', ['clean', 'complieJs', 'webserver', 'watcher'])
gulp.task('clean', () => {
    return tasks.clean(outDist)
})
gulp.task('complieJs', () => {
    return tasks.complieJs(projectEntryJs, outDist)
})
/*
gulp.task('webserver', () => {
    return tasks.webserver(projectPath)
})
*/
gulp.task('watcher', () => {
    gulp.watch(projectJs, ['complieJs', 'reloadPage'])
    //gulp.watch(projectJs, ['complieJs'])
})
gulp.task("build", () => {
    tasks.execSinglePage(projectName)
})
gulp.task("add", () => {
    return tasks.addProject(projectName, projectPath)
})


gulp.task('server', () => {
    return tasks.server(projectPath)
})
gulp.task('reloadPage', ['complieJs'], () => {
    return tasks.reloadPage(projectPath + "/demo/index.html")
})
gulp.task("openBrowser", ["server"], function() {
    var platform = process.platform
    var shellStr1 = "open -a '/Applications/Google Chrome.app' 'http://localhost:3080/demo'"
    var shellStr2 = "start http://localhost:3080/demo"
    // 打开浏览器方法：
    var openFunc = function(str, flag) {
        // 执行并对异常处理
        if (shelljs.exec(str).code !== 0) {
            shelljs.echo(flag + '下打开浏览器失败,建议您安装chrome并设为默认浏览器!')
            shelljs.exit(1);
        }
    };
    if (platform === 'darwin') {
        openFunc(shellStr1, 'Mac')
    } else if (platform === 'win32' || platform === 'win64') {
        openFunc(shellStr2, 'Windows')
    } else {
        shelljs.echo('现在只支持Mac和windows系统!如果未打开页面，请确认安装chrome并设为默认浏览器!')
    }
})


