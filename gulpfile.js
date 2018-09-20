/*
    @auther 李华 2018
*/
let gulp = require('gulp')
let minimist = require('minimist')
let config = require('./gulp.config.js')
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
    gulp.watch([projectJs, projectScss, projectHtml, projectVue], ["complieJs"])
    gulp.watch([projectPath + "/demo/index.html", projectPath + "/demo/demo.js"], ["complieDemoJS"])
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

gulp.task("openBrowser", ["server"], () => {
    tasks.openBrowser()
})

gulp.task("publish", ["incVersion"], () => {
    return tasks.publish(projectPath, publishType)
})

gulp.task("incVersion", () => {
    return tasks.incVersion(projectPath, publishType)
})