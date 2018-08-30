/*
    @auther 李华 2018
*/
let fs = require('fs')
let path = require('path')
let gulp = require('gulp')
let connect = require('gulp-connect');
let shelljs = require('shelljs')
let Orchestrator = require('orchestrator')
let orchestrator = new Orchestrator()

let babel = require('gulp-babel')
let webpack = require('webpack-stream');
let webpackConfig = require('./webpack.conf.js')
let tools = {
    camelCased(input, firstCap) {
        if (input) {
            input = input.trim();
            if (!/\d/g.test(input[0])) {
                var reg = /-(\w)/;
                if (firstCap) {
                    input = input[0].toUpperCase() + input.substring(1);
                }
                while (reg.test(input)) {
                    var match = reg.exec(input);
                    input = input.replace(match[0], match[1].toUpperCase());
                }
                return input;
            }
        }
        return '';
    },
    pascalCased(input) {
        return this.camelCased(input, true);
    }
}
let config = {
    task: {
        server(projectPath) {
            return connect.server({
                livereload: true,
                root: projectPath,
                port:3080
            });
        },
        reloadPage(page){
            return gulp.src(page)
                .pipe(connect.reload())
        },
        complieJs(files, outDist){
            files = files ? files : ['./scripts/*.js']
            return gulp.src( files )
                .pipe(babel())
                .pipe(webpack(webpackConfig))
                .pipe(gulp.dest(outDist))
        },
        execCommand(name) {
            shelljs.exec('gulp default --n ' + name)
        },

        execSinglePage(name) {
            let self = this
            orchestrator.add(name, ()=>{
                //run project
                console.log("run page: " + name);
                self.execCommand(name)
            })
            orchestrator.start(name, ()=>{
                console.log("--- run end ---")
            })
        },
        addProject(projectName, projectPath) {
            let srcPath = projectPath + "/src"
            let demoPath = projectPath + "/demo"
            fs.mkdirSync(projectPath);
            fs.writeFileSync(projectPath + "/package.json", this.processTpl("./snippet/package_tpl.snippet", projectName));
            fs.writeFileSync(projectPath + "/.gitignore", this.processTpl("./snippet/gitignore_tpl.snippet", projectName));
            fs.writeFileSync(projectPath + "/README.md", this.processTpl("./snippet/readme_tpl.snippet", projectName));
            fs.mkdirSync(srcPath);
            fs.writeFileSync(srcPath + "/index.js", this.processTpl("./snippet/indexJs_tpl.snippet", projectName));
            fs.mkdirSync(demoPath);
            fs.writeFileSync(demoPath + "/index.html", this.processTpl("./snippet/demoHtml_tpl.snippet", projectName));
        },
        processTpl(tplpath, name) {
            return fs.readFileSync(tplpath, {
                encoding: 'utf-8'
            })
            .replace(/\{\{dName\}\}/g, tools.camelCased(name)) //camel cased used for function name
            .replace(/\{\{Name\}\}/g, tools.pascalCased(name)) //pascal cased for directive literal partial
            .replace(/\{\{name\}\}/g, name) //- separated use for html page and test markup
        },
        getFolders(dir) {
            return fs.readdirSync(dir).filter((file)=> {
                return fs.statSync(path.join(dir, file)).isDirectory()
            });
        }
    }
}
module.exports = config;


