# view-table
    表格组件  @auther 李华 2014

# 安装 
    npm install view-table --save   

# 引用
    ## 方式一,
    <script src="xxx/node_modules/view-table/dist/index.min.js"></script>   
    通过全局对象window.ViewTable访问   

    ## 方式二,
    ```
    import ViewTable from "view-table"   
    ```

# 数据格式
    ## 列数据格式 Example   
    ```
        let cols = [{   
            "name": "公司名称",   
            "id": "companyName",   
            "dataType": "string",   
            "fat": "multiLevel",   
            "linkHost": "https://xxx.com/Company",   
            "width": 300   
        },{   
            "name": "市值",   
            "id": "marketValue",   
            "dataType": "number",   
            "width": 100   
        },{   
            "name": "其它信息",   
            "id": "otherInfo",   
            "childs":[{   
                "name": "网址",   
                "id": "website",   
                "fat": "link",   
                "width": 150   
            },{   
                "name": "联系地址",   
                "id": "officeAddress",   
                "width": 130   
            },{   
                "name": "联系电话",   
                "id": "contactPhone",   
                "width": 130   
            }]   
        }]   
    ```

    ## 行数据格式 Example   
    ```
        let rows = [{   
            "companyName": "重庆银行总行",   
            "marketValue": 58800000000,   
            "website": "www.cqcbank.com ",   
            "officeAddress": "重庆市渝中区邹容路153号 ",   
            "companyId": "CO00002756",   
            "contactPhone": "4007096899"   
          },{   
            "companyName": "大型机构",   
            "childs": [{   
                "companyName": "中原证券股份有限公司",   
                "marketValue": 38800000000,   
                "website": "http://www.ccnew.com/",   
                "officeAddress": "郑州市郑东新区商务外环路10号",   
                "companyId": "CO0000004H",   
                "contactPhone": "0371-65585018"   
            }]   
          }, {   
            "companyName": "中型机构",   
            "childs": [{   
                "companyName": "中原银行股份有限公司",   
                "marketValue": 28800000000,   
                "website": "www.zybank.com.cn",   
                "officeAddress": "郑州市郑东新区CBD商务外环路23号中科金座大厦",   
                "companyId": "CO00000X9O",   
                "contactPhone": "96688"   
            }]   
        },{   
            "companyName": "小型机构",   
            "childs": [{
                "companyName": "中邮证券有限责任公司",   
                "marketValue": 18800000000,   
                "website": "http://www.cn/psec.com/",   
                "officeAddress": "西安高新区唐延路5号陕西邮政信息大厦",   
                "companyId": "CO000000JA",   
                "contactPhone": "029-88497232"   
            }]   
        }]   
    ```

# 默认选项值
    ```
    {   
        fixedCol: -1, //值小于0则不固定列，大于0则按索引值将0-索引值的列固定, 最大值10   
        fixedRow: -1, //值小于0则不固定行，大于0则按索引值将0-索引值的行固定, 最大值10   
        enRowNumber：true, //每行是否显示行号值   
        enCheckbox: true, //每行是否显示checkbox   
        enCheckboxTotal: true, //是否显示全选/全取消 checkbox   
        enCollapseTotal: true, //是否显示折叠全部/展开全部按钮   
        collapseTotal: false, //是否默认折叠全部   
    }   
    ```

# 默认的列fat值列表
    "multiLevel", 表示该列的值将以多级结构显示   
    "link", 表示该列的值将显示为链接   
    "string", 表示该列的值将显示为字符串   
    "number", 表示该列的值将显示为数据   

# 自定义fat
    ```
    let fats = {   
        custom1(value, rowData, colData, rowIndex, colIndex, cellEl) {   
            //TODO   
        },   
        custom2(value, rowData, colData, rowIndex, colIndex, cellEl) {   
            //TODO   
        }   
    }   
    xxx.setFat(fats) //通过调用setFat方法设置fat   
    ```


# 使用
    ```
    let $container = $(".tableContainer")   
    let vtable = new ViewTable($container)   
    //vtable.setOpt(option); //如需改变默认选项，则通过调用setOpt设置   
    //vtable.setFat(fat); //如需改变默认fat,则通过调用setFat设置   
    vtable.setData(cols, rows);   
    vtable.render(); //第一次初始化渲染表格   
    ```

# 方法
    setOpt(opts) 设置修改默认选项值   
    setFat(fats) 设置自定义fat   
    setData(cols, rows) 设置列数据，行数据   
    getSectRows() 获取选中的行列表   
    render() 渲染表格   
    reset() 重置表格,当数据变化时需要重新初始化表格时调用此方法重置表格   
    update() 更新表格, 当数据变化时只需要更新表格时调用此方法更新表格   
    resize() 当外部容器大小发生变化时,调用此方法更新表格大小   
    destroy() 摧毁表格   

# 事件（所有事件绑定函数均有evt, data两个参数, data.e是原始点击事件信息）
    onRenderComplete 表格渲染完成后触发   
    onClick 当行被点击时触发事件   
    onHeaderClick 当列头被点击时触发   
    onHeaderMouseOver 列头鼠标over时触发   
    onHeaderMouseOut 列头鼠标out时触发   
    onCellMouseOver 单元格鼠标over时触发   
    onCellMouseOut  单元格鼠标out时触发   
    onMultiLevelClick 当多级结构数据的展开/折叠按钮被点击时触发   
    onMultiLevelAllClick  当列头的展开全部/折叠全部按钮被点击时触发   
    onCheckboxClick 当行的chekbox被点击时触发   
    onCheckboxTotalClick 当列头的全选/全取消chekbox被点击时触发   


