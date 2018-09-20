/*
    @auther 李华 2018
*/
let fs = require('fs')
let path = require('path')
let gulp = require('gulp')
let connect = require('gulp-connect');
//let webserver = require('gulp-webserver');
let clean = require('gulp-clean')
let bump = require('gulp-bump');
let inject = require('gulp-inject');
let shelljs = require('shelljs')
let Orchestrator = require('orchestrator')
let orchestrator = new Orchestrator()

let babel = require('gulp-babel')
//let webpack = require('webpack-stream')
let webpack = require('webpack')
let merge = require('webpack-merge')
let webpackConfig = require('./webpack.conf.js')

let tools = {
    camelCased(input, firstCap) {
        if (input) {
            input = input.trim();
            if (!/\d/g.test(input[0])) {
                let reg = /-(\w)/;
                if (firstCap) {
                    input = input[0].toUpperCase() + input.substring(1);
                }
                while (reg.test(input)) {
                    let match = reg.exec(input);
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
        clean(path) {
            return gulp.src(path)
                .pipe(clean())
        },
        server(projectPath) {
            this.hasBeenServer = true;
            return connect.server({
                livereload: true,
                root: projectPath,
                port: 3080
            });
        },
        openBrowser() {
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
            this.hasOpenBrowser = true;
        },
        reloadPage(page) {
            return gulp.src(page)
                .pipe(connect.reload())
        },
        complieJs(projectName, projectPath) {
            let self = this;
            let entryJson = require(projectPath + "/entry.json")
            let entry = entryJson.entry
            let output = entryJson.output

            let entryConfig = null
            if(typeof(entry) == "string") {
                entryConfig = projectPath + "/" + entry
            } else if(entry instanceof Array) {
                entryConfig = []
                entry.forEach(function(item){
                    entryConfig.push(projectPath + "/" + item)
                })
            } else {
                entryConfig = {}
                for(let k in entry) {
                    entryConfig[k] = projectPath + "/" + entry[k]
                }

            }
            let cf = merge(webpackConfig, {
                entry: entryConfig,
                output: {
                    path: path.resolve(__dirname, "components/" + projectName + "/" + output.path)
                }
            })
            return webpack(cf, (err, status)=>{
                if(status.compilation.errors.length > 0) {
                    console.log("-------------------- Error --------------------")
                    console.log(status.compilation.errors)
                }
                console.log("===== complie src end =====")
                if(self.hasBeenServer && self.hasOpenBrowser) {
                    console.log("===== reload page =====")
                    self.reloadPage(projectPath + "/demo/index.html")
                }
            })
        },
        execCommand(name) {
            shelljs.exec('gulp default --n ' + name)
        },

        execSinglePage(name) {
            let self = this
            orchestrator.add(name, () => {
                //run project
                console.log("run page: " + name);
                self.execCommand(name)
            })
            orchestrator.start(name, () => {
                console.log("--- run end ---")
            })
        },
        addProject(projectName, projectPath) {
            let srcPath = projectPath + "/src"
            let demoPath = projectPath + "/demo"
            fs.mkdirSync(projectPath);
            fs.writeFileSync(projectPath + "/entry.json", this.processTpl("./snippet/comPackEntry_tpl.snippet", projectName));
            fs.writeFileSync(projectPath + "/package.json", this.processTpl("./snippet/package_tpl.snippet", projectName));
            fs.writeFileSync(projectPath + "/.gitignore", this.processTpl("./snippet/gitignore_tpl.snippet", projectName));
            fs.writeFileSync(projectPath + "/README.md", this.processTpl("./snippet/readme_tpl.snippet", projectName));
            fs.mkdirSync(srcPath);
            fs.mkdirSync(srcPath + "/template");
            fs.mkdirSync(srcPath + "/scss");
            fs.writeFileSync(srcPath + "/index.js", this.processTpl("./snippet/indexJs_tpl.snippet", projectName));
            fs.writeFileSync(srcPath + "/template/index.vue", this.processTpl("./snippet/comHtml_tpl.snippet", projectName));
            fs.writeFileSync(srcPath + "/scss/index.scss", this.processTpl("./snippet/comScss_tpl.snippet", projectName));
            fs.mkdirSync(demoPath);
            fs.writeFileSync(demoPath + "/index.html", this.processTpl("./snippet/demoHtml_tpl.snippet", projectName));
            fs.writeFileSync(demoPath + "/demo.js", this.processTpl("./snippet/demoJs_tpl.snippet", projectName));
        },

        installComNpm(projectName, projectPath) {
            console.log("cd " + projectPath)
            shelljs.cd(projectPath);
            console.log("install " + projectName + " component dependencies")
            shelljs.exec("npm install")
        },

        processTpl(tplpath, name) {
            return fs.readFileSync(tplpath, {
                    encoding: 'utf-8'
                })
                .replace(/\#\#dName\#\#/g, tools.camelCased(name)) //camel cased used for function name
                .replace(/\#\#Name\#\#/g, tools.pascalCased(name)) //pascal cased for directive literal partial
                .replace(/\#\#name\#\#/g, name) //- separated use for html page and test markup
        },

        getFolders(dir) {
            return fs.readdirSync(dir).filter((file) => {
                return fs.statSync(path.join(dir, file)).isDirectory()
            });
        },

        publish(projectPath, publishType) {
            shelljs.cd(projectPath);
            shelljs.exec("npm publish")
        },

        incVersion(projectPath, publishType) {
            let typeMap = {
                "major": "major",
                "minor": "minor",
                "patch": "patch"
            }
            publishType = typeMap[publishType] || "patch"
            return gulp.src(projectPath + "/package.json")
                .pipe(bump({ type: publishType }))
                .pipe(gulp.dest(projectPath))
        },

        proxyExec(projectPath) {
            shelljs.cd(projectPath);
            shelljs.exec("npm run build")
        },

        injectDemoHTML(projectName, projectPath) {
            let pk = require(projectPath + "/package.json")
            if (!pk) {
                return false
            }
            let dependencies = pk.dependencies
            if (!dependencies) {
                return false
            }
            let dpendencyFiles = []
            let npk = null
            let npkFile = ""
            let nmPath = projectPath + "/node_modules"
            for (key in dependencies) {
                npk = require(nmPath + "/" + key + "/package.json")
                if(!npk) {
                    continue
                }
                if(npk.unpkg) {
                    npkFile = npk.unpkg
                }
                else if(npk.bundlesize) {
                	npkFile = npk.bundlesize[0].path
                }else{
                	npkFile = npk.main
                }
                

                dpendencyFiles.push(nmPath + "/" + key + "/" + npkFile)
            }
            gulp.src(projectPath + "/demo/index.html")
                .pipe(inject(gulp.src(dpendencyFiles, { read: false }), { relative: true }))
                .pipe(gulp.dest(projectPath + "/demo"));

        },

        complieDemoJS(projectName, projectPath) {
            let demoPath = projectPath + "/demo"
            let cf = merge(webpackConfig, {
                entry: {
                    demo: demoPath + "/demo.js"
                },
                output: {
                    path: path.resolve(__dirname, "components/" + projectName + "/demo")
                }
            })
            return webpack(cf, (err, status) => {
                console.log("complie demo end =====")
            })
        }	
    }
}
module.exports = config;