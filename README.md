# Components Development Workflow
    基于Node, Gulp, Webpack等的一款前端组件构建预览，以及发布到内部NPM服务的工作流程平台
    作者: 李华

# 环境安装 

    1. 安装最新版Node， 下载地址 https://nodejs.org/en/download/

    2. 全局安装gulp: npm install gulp -g

    3. 全局安装nrm： npm install nrm -g

    4. 添加myserver NPM服务： nrm add myserver http://xxx.xxx.xxx.xxx:4873/

    5. 使用myserver NPM服务： nrm use myserver

    6. 登陆myserver NPM服务： npm login   然后输入 用户名,密码,邮箱 登陆

    7. 安装平台依赖： npm install

# 平台目录结构

    /components        组件目录
    |   |---/组件1目录
    |   |   |---/demo                 组件1 demo目录
    |   |   |   |---/index.html
    |   |   |---/dist                 组件1 构建目录
    |   |   |   |---/main.min.js
    |   |   |---/src                  组件1 源文件目录
    |   |   |   |---/index.js
    |   |   |---.gitignore            组件1 gitignore
    |   |   |---package.json          组件1 package
    |   |   |---README.md             组件1 readme
    |   |---/组件2目录
             .......
    /node_modules      依赖包目录
    /snippet           空组件模版目录
    /gulp.config.js    gulp任务配置文件
    /gulpfile.js       gulp任务文件
    /webpack.conf.js   webpack配置文件
    /package.json      平台package文件
    /README.md         平台readme

# 平台命令详解

    1. add: 根据模板创建空组件
        参数 --n 组件名称，必须
        示例: gulp add --n test ，在components文件夹下创建一个名为test的组件
        组件目录结构：
        /test
        |   |---/demo
        |   |   |----/index.html
        |   |---/dist
        |   |   |---/main.min.js
        |   |---/src
        |   |   |---/index.js
        |   |---/.gitgnore
        |   |---/package.json
        |   |---/README.md

    2. installComNpm: 安装组件相关的依赖包
        参数 --n 组件名称，必须
        示例: gulp installComNpm --n test
        *当然也可以自己切换到组件目录下执行 npm install。

    3. build: 根据组件src/index.js打包构建组件
        参数 --n 组件名称，必须
        示例: gulp build --n test ，构建test组件代码生成到dist/main.min.js, 
        Build组件后目录结构：
        /test
        |   |---/demo
        |   |   |----/index.html
        |   |---/dist
        |   |   |---/main.min.js
        |   |---/node_modules
        |   |---/src
        |   |   |---/index.js
        |   |---/.gitgnore
        |   |---/package.json
        |   |---/README.md

    4. preview: 自动执行build命令，然后预览组件
        参数 --n 组件名称，必须
        示例: gulp preview --n test 
        

    5. publish: 发布/更新组件到myserver NPM服务
        参数 --n 组件名称，必须
        参数 --t 版本类型，可选，默认为 patch，
                patch  小版本号+1
                minor  中版本号+1
                major  大版本号+1
            
        示例1: gulp publish --n test
        发布组件"test" 小版本到myserver NPM服务，名称为"xxx-test"(名称自动加上前缀"xxx-")，版本号为：1.0.1
        示例2: gulp publish --n test --t minor
        发布组件"test" 中版本到myserver NPM服务，版本号为：1.1.0
        示例3: gulp publish --n test --t major
        发布组件"test" 中版本到myserver NPM服务，版本号为：2.0.0
        ---------------------------------------------------------------------
        注意： 
        如果没有将npm的registry地址切换到myserver镜像，必须先切换到myserver镜像。
        **执行： nrm use myserver 切换到myserver镜像**
        如果没有登陆到myserver镜像，必须先登出myserver镜像。
        **执行:  npm login 输入用户名密码登陆 myserver镜像**
        否则无法成功publish。
        
