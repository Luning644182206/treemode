/*
 * @ 树模型构建图 -- treeview --> treemode 
 * @ 输出 --> 树模型对象
 * @ 参数
 * @ author : blessbygod
 * @ email  : 25018238@qq.com
 * @ mark   : 语法校验严格
 * @ 2种模式--> DOM模式和纯展示模式 
 * */
 
 
(function( $, win, undef ){
    $.fn.treeMode = function( options ){ 
        var _oTree = this,
            //default options
            options = _.extend({ 
                initialize : function(){ 
                    //initialize status 
                    if( _.isArray( this.flatData ) === false ){
                        this.flatData = [];
                    } 
                    if( _.isString( this.idKey ) === false ){
                        this.idKey = "id";
                    }
                    if( _.isString( this.parentIdKey ) === false ){
                        this.parentIdKey = "parentId";
                    }
                    if( _.isString( this.labelKey ) === false ){
                        this.parentIdKey = "label";
                    }
					if( _.isString( this.rootPId ) === false ){
                        this.rootPId = -1;
                    }
                    if( _.isString( this.rootId ) === false ){
                        this.rootId = null;
                    } 
                    if( _.isArray( this.datas ) === false ){
                        this.datas = [];
                    } 
                    if( _.isObject( this.icons ) === false ){
                        this.icons = {
                             L0        : 'L0',  //┏
                             L1        : 'L1',  //┣
                             L2        : 'L2',  //┗
                             L3        : 'L3',  //━
                             L4        : 'L4',  //┃
                             PM0       : 'P0',  //＋┏
                             PM1       : 'P1',  //＋┣
                             PM2       : 'P2',  //＋┗
                             PM3       : 'P3',  //＋━
                             M0		   : 'M0',
                             M1		   : 'M1',
                             M2		   : 'M2',		 
                             empty     : 'empty'       //空白图 
                        }	
                    } 
                    //内部函数 -- 回头换成私有变量
                    this.treeData = [];
                    this.forEachNumber = 0; //计算树遍历的递归次数
                    
                    /*
                     * 必须排序，画树需要的参数在排序中获得
                     */ 
                  
					this.depthSortData();
                    
                },
                dictFlatData:function( data ){
                    var opts = this,dict = {};
                    //id,为键，pid为值
                    _.each( data,function( item ){
                        var key = item[ opts.idKey ],
                            val = item[ opts.parentIdKey ];
                        dict[ key ] = val;
                    });
                    return dict;
                },
                formatFlatData:function( data ){ 
                    var opts = this,format = {};  
                    _.each( data,function( item ){
                        var key = item[ opts.parentIdKey ];
                        if( format.hasOwnProperty( key ) === false ){
                            format[ key ] = [];
                        }
                        format[key].push( item ); 
                    });
                    return format;
                },
                orderFlatData:function( formatData,dictData,cNode,lines,isStraight ){
                    var opts = this; 
                    lines  = _.isArray( lines ) ? lines : [];
                    if( ( _.isArray( formatData ) && formatData.length === 0 ) ){ 
                        return;
                    } 
                    //debugger;
                    if( formatData.hasOwnProperty( cNode ) ){
                        this.forEachNumber++;
                        var temp = formatData[ cNode ].shift();
                            this.treeData.push( temp ); 
                        if( formatData[ cNode ].length === 0 ){ 
                            delete formatData[ cNode ];
                            temp.isEnd = true;
                        } 
                        if( isStraight ){
                            lines.push(0);
                        }else{
                            if( opts.rootId === temp[ opts.parentIdKey ] ){ 
								lines.push(0);
							}else{
								lines.push(1);
							}
                        }
                        temp.lines = _.clone( lines );
                        return opts.orderFlatData( formatData,dictData,temp[ opts.idKey ],lines,temp.isEnd );
                    }else{
                        if( dictData.hasOwnProperty( cNode ) ){
                            this.forEachNumber++;  
                            lines.pop();  
                            return opts.orderFlatData( formatData,dictData,dictData[ cNode ],lines );
                        }
                    }
                },
                //深度排序数组数据
                //arguments[2] -- > 顶点的parentId
                depthSortData:function(){ 
                    if( _.isArray( this.flatData ) ){
                        var dictData = this.dictFlatData( this.flatData ),
                            formatData = this.formatFlatData( this.flatData ); 
                        this.orderFlatData( formatData,dictData,this.rootPId ); 
                    }  
                },
				_expandOrCollapse:function( params ){
					var $el = params.$el,
						$parent = params.$parent,
						className = params.className,
						cLevel = params.cLevel,
						cClass = params.cClass,
						rClass = params.rClass,
						expandFlag = params.expandFlag;
					var expandArr = []; 
					$parent.nextAll().each( function( index,item ){ 
						var $item = $( item );
						var level = $item.data('level'),
							id = $item.data('id'); 
						if( level > cLevel ){ 
							if(  _.include( expandArr,id ) === false  ){
								if( $item.data('expand') === true ){
									$item.nextAll().each( function(){
										var $son = $( this );
										var sLevel = $son.data('level'),
											sId    = $son.data('id');
										if( sLevel > level ){
										   expandArr.push( sId );
										}else{
											return false;
										}  
									}); 
								}
								expandFlag ? $item.hide() : $item.show();
								$parent.data( 'expand',expandFlag );
								$el.removeClass().addClass( className.replace( cClass,rClass ) );
							} 
						}else{ 
							return false;
						}
					}); 
				}
            },options );
        
        options.initialize();  //初始化执行过后,默认参数才生效;
        
        /*
         * 准备画树,DOM结构更简单,效率更高,也可以在深度排序时直接画好，只是那样就不清晰了。
         * */
        var treeHTMLArr = [];
        treeHTMLArr.push( '<ul class="tree_root" >' );
        _.each( options.treeData,function( data ){ 
            var label = data[ options.labelKey ],
                id = data[ options.idKey ],
                lines = data.lines, 
                isEnd = data.isEnd;
            var dataKeys = options.datas; 
            var data_level = 'data-level="' + lines.length + '"',//画树不需要level,标识而已
                data_id    = 'data-id="' + id +'"',
                data_end   = 'data-end="' + isEnd + '"';
            var datasHTMLArr =  [];
            _.each( dataKeys,function( dataKey ){
               var dataVal =  data[ dataKey ];
               datasHTMLArr.push( 'data-' + dataKey + '="' + dataVal + '"' );
            });
            datasHTMLArr.unshift( data_level );
            datasHTMLArr.unshift( data_id );
            datasHTMLArr.unshift( data_end );
            var linesHTML = [];
            _.each( lines,function( line,index ){
                if( index === 0 ){
                    return;
                }
                var className = 'icon_' + ( line === 1 ? options.icons.L4 : options.icons.empty );
                linesHTML.push( '<b class="' + className + '"></b>' );
            });
            var endClassName = 'icon_' + ( isEnd === true ? options.icons.M2 : options.icons.M1 );
            linesHTML.push( '<b class="' + endClassName + '"></b>' ); 
            var liHTMLArr = [
                '<li class="tree_node" ',datasHTMLArr.join(' '),'>',
                    linesHTML.join(' '),
                    '<b class="tree_label" >',label,'</b>',
                '</li>'
            ];
            treeHTMLArr.push( liHTMLArr.join('') );
        });
        treeHTMLArr.push( '</ul>' ); 
        _oTree.html( treeHTMLArr.join('') ).css('position','relative'); 
        //事件绑定--扁平结构的缺点就是控制树级的显示隐藏出了麻烦
        /*事件-BEGIN-*/
        $( _oTree ).on('click','b',function(e){ 
            var $el = $( e.currentTarget );  
            var $parent = $el.parent();
            var cLevel = $parent.data('level');
            var className = $el.attr('class'); 
			var _params = {
				$el : $el,
				$parent : $parent,
				className: className,
				cLevel : cLevel 
			}
            if( className.indexOf('M') > -1 ){
				_.extend( _params,{ 
					cClass : 'M',
					rClass : 'P',
					expandFlag : true
				}); 
            }else if( className.indexOf('P') > -1 ){
				_.extend( _params,{ 
					cClass : 'P',
					rClass : 'M',
					expandFlag : false
				}); 
            } 
			options._expandOrCollapse( _params ); 
            return false;
        });
        return _oTree;
    };
})( jQuery,window,undefined );