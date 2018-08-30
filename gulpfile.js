/*
    @auther 李华 2018
*/
let gulp = require('gulp')
let minimist = require('minimist')
let config = require('./gulp.config.js')
let envirionment = minimist( process.argv.slice(2))

let componentsPath = './components/'
let projectName = envirionment.n
let projectPath = componentsPath + projectName
let projectEntryJs = projectPath + "/**/index.js"
let projectJs = projectPath + "/src/**/*.js"
let outDist = componentsPath + projectName + "/dist"
let tasks = config.task
gulp.task('default', ['complieJs', 'server', 'watcher'])

gulp.task('reloadPage', ['complieJs'], () => {
    return tasks.reloadPage(projectPath + "/demo/index.html")
})
gulp.task('complieJs', () => {
    return tasks.complieJs(projectEntryJs, outDist)
})
gulp.task('server', () => {
    return tasks.server(projectPath)
})
gulp.task('watcher', () => {
    gulp.watch(projectJs, ['complieJs', 'reloadPage'])
})
gulp.task("build", ()=>{
    tasks.execSinglePage(projectName)
})
gulp.task("add", ()=>{
    return tasks.addProject(projectName, projectPath)
})


