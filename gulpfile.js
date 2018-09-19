/*
    @auther 李华 2018
*/
let gulp = require('gulp')
let minimist = require('minimist')
let config = require('./gulp.config.js')
let shelljs = require('shelljs')
let envirionment = minimist(process.argv.slice(2))

let projectName = envirionment.n
let publishType = envirionment.t || "patch"
let componentsPath = './components/'
let projectPath = componentsPath + projectName
let projectJs = projectPath + "/src/**/*.js"
let projectScss = projectPath + "/src/**/*.scss"
let projectHtml = projectPath + "/src/**/*.html"
let projectVue = projectPath + "/src/**/*.vue"
let outDist = componentsPath + projectName + "/dist"
let tasks = config.task

let registryURL = "http://112.74.196.215:4888"

gulp.task('default', ['clean', 'complieJs'])

gulp.task('clean', () => {
    return tasks.clean(outDist)
})
gulp.task('complieJs', () => {
    return tasks.complieJs(projectName, projectPath)
})

gulp.task('watcher', () => {
    gulp.watch([projectJs, projectScss, projectHtml, projectVue], ["complieJs", "reloadPage"])
    gulp.watch([projectPath + "/demo/index.html", projectPath + "/demo/demo.js"], ["complieDemoJS", "reloadPage"])
})
gulp.task("build", () => {
    if (projectName !== "charts") {
        tasks.execSinglePage(projectName)
    } else {
        task.proxyExec(projectPath)
    }
})

gulp.task("injectDemoHTML", () => {
    return tasks.injectDemoHTML(projectName, projectPath)
})

gulp.task("complieDemoJS", () => {
    return tasks.complieDemoJS(projectName, projectPath)
})

gulp.task("preview", ["openBrowser", "watcher"])


gulp.task("add", ["addProject"])

gulp.task("addProject", () => {
    return tasks.addProject(projectName, projectPath)
})
gulp.task("installComNpm", () => {
    return tasks.installComNpm(projectName, projectPath)
})

gulp.task('server', ["build", "injectDemoHTML", "complieDemoJS"],  () => {
    return tasks.server(projectPath)
})
gulp.task('reloadPage', () => {
    return tasks.reloadPage(projectPath + "/demo/index.html")
})
gulp.task("openBrowser", ["server"], () => {
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

gulp.task("publish", ["incVersion"], () => {
    return tasks.publish(projectPath, publishType)
})

gulp.task("incVersion", () => {
    return tasks.incVersion(projectPath, publishType)
})