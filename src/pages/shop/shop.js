/**
 * Created by chen on 2017/4/12.
 */
import './shop.scss';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';

import Loading from 'components/common/Loading';
import RatingStar from 'components/common/RatingStar';

import {msiteAdress, shopDetails, foodMenu, getRatingList, ratingScores, ratingTags} from '../../service/getData';
import { saveLatLntActions } from '../../actions';
import {getImgPath} from '../../plugins/mixin';
import BScroll from 'better-scroll'

class Shop extends Component {
  constructor(props){
    super(props);
    this.state = {
      geohash: '',//geohash位置信息
      shopId: null,//商店id值
      showLoading: true, //显示加载动画
      shopDetailData: null, //商铺详情
      menuList: [], //食品列表
      ratingList: null, //评价列表
      ratingOffset: 0, //评价获取数据offset值
      ratingScoresData: null, //评价总体分数
      ratingTagsList: null, //评价分类列表
      loadRatings: false, //加载更多评论是显示加载组件
      showActivities: false, //是否显示活动详情
      changeShowType: 'food',//切换显示商品或者评价
      categoryNum: [], //商品类型右上角已加入购物车的数量
      menuIndex: 0, //已选菜单索引值，默认为0
      menuIndexChange: true,//解决选中index时，scroll监听事件重复判断设置index的bug
      windowHeight: null, //屏幕的高度
      shopListTop: [], //商品列表的高度集合
      wrapperMenu: null,
      foodScroll: null,  //食品列表scroll
      TitleDetailIndex: null, //点击展示列表头部详情
    }
  }

  componentWillMount() {
    this.setState({
      geohash: this.props.location.query.geohash,
      shopId: this.props.location.query.id
    })
    //初始化购物车
  }



  componentDidMount() {
    this.initData();
    this.setState({
      windowHeight: window.innerHeight
    })
  }

  async initData(){
    if (!this.props.savelatlnt) {
      //获取位置信息
      let res = await msiteAdress(this.state.geohash);
      // 记录当前经度纬度进入vuex
      this.props.saveLatLnt(res)
    }
    let shopId = this.state.shopId;
    //获取商铺信息
    let shopDetailData = await shopDetails(shopId, this.state.latitude, this.state.longitude);
    // //获取商铺食品列表
    let menuList = await foodMenu(shopId);
    // //评论列表
    let ratingList = await getRatingList(this.state.ratingOffset);
    // //商铺评论详情
    let ratingScoresData = await ratingScores(shopId);
    // //评论Tag列表
    let ratingTagsList = await ratingTags(shopId);

    this.setState({
      shopDetailData, menuList, ratingList, ratingScoresData, ratingTagsList
    })

    // this.RECORD_SHOPDETAIL(this.shopDetailData)
    // //隐藏加载动画
    this.hideLoading();
  }

  showActivitiesFun = () => {
    this.setState({
      showActivities : !this.state.showActivities
    })
  }

  hideLoading = () => {
    this.setState({
      showLoading: false
    })
    if (!this.state.showLoading) {
      this.getFoodListHeight();
      // this.initCategoryNum();
    }
  }

  getFoodListHeight(){
    const baseHeight = this.refs.shopheader.clientHeight;
    const chooseTypeHeight = this.refs.chooseType.clientHeight;
    const listContainer = this.refs.menuFoodList;
    const listArr = Array.from(listContainer.children[0].children);
    let shopListTop = [];
    listArr.forEach((item, index) => {
      shopListTop[index] = item.offsetTop - baseHeight - chooseTypeHeight;
    });
    this.setState({
      shopListTop : shopListTop
    });
    this.listenScroll(listContainer)
  }
  listenScroll(element){
    let oldScrollTop;
    let requestFram;
    let foodScroll = new BScroll(element, {
      probeType: 3,
      deceleration: 0.001,
      bounce: false,
      swipeTime: 2000,
      click: true,
    });

    let wrapperMenu = new BScroll('#wrapper_menu', {
      click: true,
    });

    foodScroll.on('scroll', (pos) => {
      this.state.shopListTop.forEach((item, index) => {
        if (this.state.menuIndexChange && Math.abs(Math.round(pos.y)) >= item) {
          this.setState({
            menuIndex : index
          })
        }
      })
    })
    this.setState({
      foodScroll: foodScroll,
      wrapperMenu: wrapperMenu
    })
  }

  changeShowType = (value) => {
    this.setState({
      changeShowType: value
    })
  }

  chooseMenu = (index) => {
    this.setState({
      menuIndex: index,
      menuIndexChange : false
    })
    this.state.foodScroll.scrollTo(0, -this.state.shopListTop[index], 400);
    this.state.foodScroll.on('scrollEnd', () => {
      this.setState({
        menuIndexChange : true
      })
    })
  }

  showTitleDetail = (index) =>{
    let  TitleDetailIndex;
    if (this.state.TitleDetailIndex == index) {
      TitleDetailIndex = null;
    }else{
      TitleDetailIndex = index;
    }
    this.setState({
      TitleDetailIndex:  TitleDetailIndex
    })
  }
  render() {
    let shopDetailData = this.state.shopDetailData;
    return (
    <div>
      {
        this.state.showLoading || this.state.loadRatings ? <Loading></Loading> : ''
      }
      {
        !this.state.showLoading ?
          <section className="shop_container">
            <header className="shop_detail_header" ref="shopheader" style={{ zIndex: this.state.showActivities? '14':'10' }}>
              <img src={ shopDetailData ? getImgPath(shopDetailData.image_path) : '' } alt="" className="header_cover_img"/>
              <section className="description_header">
                <Link to="/shop/shopDetail" className="description_top">
                  <section className="description_left">
                    <img src={ this.state.shopDetailData ? getImgPath(this.state.shopDetailData.image_path) : '' } alt=""/>
                  </section>
                  <section className="description_right">
                    <h4 className="description_title ellipsis">{shopDetailData.name}</h4>
                    <p className="description_text">商家配送／{shopDetailData.order_lead_time}分钟送达／配送费¥{shopDetailData.float_delivery_fee}</p>
                    <p className="description_promotion ellipsis">公告：{shopDetailData.promotion_info || '欢迎光临，用餐高峰期请提前下单，谢谢。'}</p>
                  </section>
                  <svg width="14" height="14" xmlns="http://www.w3.org/2000/svg" version="1.1" className="description_arrow" >
                    <path d="M0 0 L8 7 L0 14"  stroke="#fff" strokeWidth="1" fill="none"/>
                  </svg>
                </Link>
                {
                  shopDetailData.activities.length ?
                    <footer className="description_footer" onClick={ this.showActivitiesFun }>
                      <p className="ellipsis">
                        <span className="tip_icon" style={{backgroundColor: '#' + shopDetailData.activities[0].icon_color, borderColor: '#' + shopDetailData.activities[0].icon_color}}>{shopDetailData.activities[0].icon_name}</span>
                      <span>{shopDetailData.activities[0].description}（APP专享）</span>
                    </p>
                    <p>{shopDetailData.activities.length}个活动</p>
                    </footer> : ''
                }
              </section>
              </header>
            {
              this.state.showActivities ?
                <section className="activities_details animated fadeIn">
                  <h2 className="activities_shoptitle">{shopDetailData.name}</h2>
                  <h3 className="activities_ratingstar">
                    <RatingStar rating={shopDetailData.rating}></RatingStar>
                  </h3>
                  <section className="activities_list">
                    <header className="activities_title_style"><span>优惠信息</span></header>
                    <ul>
                      {
                        shopDetailData.activities.map(item => {
                          return (
                            <li key={item.id}>
                              <span className="activities_icon" style={{backgroundColor: '#' + item.icon_color, borderColor: '#' + item.icon_color}}>{item.icon_name}</span>
                              <span>{item.description}（APP专享）</span>
                            </li>
                          )
                        })
                      }
                    </ul>
                    </section>
                    <section className="activities_shopinfo">
                      <header className="activities_title_style"><span>商家公告</span></header>
                      <p>{shopDetailData.promotion_info || '欢迎光临，用餐高峰期请提前下单，谢谢。'}</p>
                    </section>
                    <svg width="60" height="60" className="close_activities" onClick ={this.showActivitiesFun}>
                      <circle cx="30" cy="30" r="25" stroke="#555" strokeWidth="1" fill="none"/>
                      <line x1="22" y1="38" x2="38" y2="22" style={{stroke:'#999',strokeWidth:2}}/>
                      <line x1="22" y1="22" x2="38" y2="38" style={{stroke:'#999',strokeWidth:2}}/>
                    </svg>
                </section> : ''
            }
            <section className="change_show_type" ref="chooseType">
              <div>
                <span className={ this.state.changeShowType  =="food" ? 'activity_show' : ''} onClick={this.changeShowType.bind({}, 'food')}>商品</span>
              </div>
              <div>
                <span className= {this.state.changeShowType  =="rating" ? 'activity_show' : ''} onClick={this.changeShowType.bind({}, 'rating')}>评价</span>
              </div>
            </section>
            {
              this.state.changeShowType === 'food' ?
                <section className="food_container">
                  <section className="menu_container">
                    <section className="menu_left" id="wrapper_menu">
                      <ul>
                        {
                          this.state.menuList.map((item, index) => {
                            return (
                              <li className={ this.state.menuIndex === index ? 'menu_left_li activity_menu' : 'menu_left_li' } onClick={ this.chooseMenu.bind({},index) } key={index}>
                                {
                                  item.icon_url ?<img src={getImgPath(item.icon_url)}/> : ''
                                }
                                <span>{item.name}</span>
                                { this.state.categoryNum[index]&&item.type == 1 ?  <span className="category_num">{this.state.categoryNum[index]}</span> : ''}
                              </li>
                            )
                          })
                        }
                      </ul>
                    </section>
                    <section className="menu_right" ref="menuFoodList">
                      <ul>
                        {
                          this.state.menuList.map((item, index) => {
                            return (
                              <li key={index}>
                                <header className="menu_detail_header">
                                  <section className="menu_detail_header_left">
                                    <strong className="menu_item_title">{item.name}</strong>
                                    <span className="menu_item_description">{item.description}</span>
                                  </section>
                                  <span className="menu_detail_header_right" onClick={this.showTitleDetail.bind({},index)}></span>
                                  {
                                    this.state.TitleDetailIndex === index ?
                                    <p className="description_tip" >
                                      <span>{item.name}</span>
                                      {item.description}
                                    </p> : ''
                                  }
                                </header>
                                {
                                  item.foods.map((foods, foodindex) => {
                                    return (
                                      <section key={foodindex} className="menu_detail_list"><Link to={{pathname: 'shop/foodDetail', query:{image_path:foods.image_path, description: foods.description, month_sales: foods.month_sales, name: foods.name, rating: foods.rating, rating_count: foods.rating_count, satisfy_rate: foods.satisfy_rate, foods, shopId :this.state.shopId}}} >
                                        <div  className="menu_detail_link">

                                              <section className="menu_food_img">
                                                <img src={getImgPath(foods.image_path)}/>
                                              </section>
                                              <section className="menu_food_description">
                                                <h3 className="food_description_head">
                                                  <strong className="description_foodname">{foods.name}</strong>
                                                  {
                                                    foods.attributes.length?
                                                      <ul  class="attributes_ul">
                                                        {
                                                          foods.attributes.map((attribute, foodi) => {
                                                            return (
                                                              <li key={foodi} style={{color: '#' + attribute.icon_color,borderColor:'#' +attribute.icon_color}}  className={ attribute.icon_name == '新' ?  'attribute_new': '' }>
                                                               <p style={{color: attribute.icon_name == '新'? '#fff' : '#' + attribute.icon_color}}>{attribute.icon_name == '新'? '新品':attribute.icon_name}</p>
                                                              </li>
                                                            )
                                                          })
                                                        }
                                                      </ul> : ''
                                                  }

                                                 </h3>
                                                <p className="food_description_content">{foods.description}</p>
                                                <p className="food_description_sale_rating">
                                                  <span>月售{foods.month_sales}份</span>
                                                  <span>好评率{foods.satisfy_rate}%</span>
                                                 </p>
                                               </section>

                                        </div></Link>
                                        <footer className="menu_detail_footer">
                                          <section className="food_price">
                                            <span>¥</span>
                                            <span>{foods.specfoods[0].price}</span>
                                            {
                                              foods.specifications.length? <span >起</span> : ''
                                            }

                                          </section>
                                         </footer>
                                       </section>
                                    )
                                  })
                                }
                              </li>
                            )
                          })
                        }
                      </ul>
                    </section>
                  </section>
                </section>
                :''
            }



          </section>: ''
      }

    </div>

    )
  }
}

function mapStateToProps(state) {
  return {
    savelatlnt : state.savelatlnt
  }
}

function mapDispatchToProps(dispatch) {
  return {
    saveLatLnt: (res) => dispatch(saveLatLntActions(res))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Shop);
