var React = require('react');
var ReactMenuAim = require('react-menu-aim');

const Menu = React.createClass({
  mixins: [ReactMenuAim],

  getInitialState: function() {
    return {activeMenuIndex: 0};
  },

  componentWillMount: function() {
    // Config ReactMenuAim here
    this.initMenuAim({
      submenuDirection: 'right',
      menuSelector: '.menu'
    });
  },

  // This is your true handler when a menu item is going to be active
  handleSwitchMenuIndex: function(index) {
    // ...
    this.setState({activeMenuIndex: index});
  },

  // `handleMouseLeaveMenu` and `handleMouseEnterRow` are provided by ReactMenuAim,
  // you can provide your own handler bound to them
  render: function() {
    let self = this;
    let menuPosition = {
      left: this.props.position.x,
      top: this.props.position.y
    };
    return (
      <div className="menu-container" style={menuPosition}>
        <ul className="menu" onMouseLeave={this.handleMouseLeaveMenu}>
          {this.props.menuData.map(function(menu, index) {
            var className = 'menu-item';
            if (index === self.state.activeMenuIndex) {
              className += ' active';
            }

            return (
              <li className={className} key={index}
                  onMouseEnter={function(){
                    self.handleMouseEnterRow.call(self, index, self.handleSwitchMenuIndex);
                  }}>
                {menu.name}
              </li>
            );
          })}
        </ul>
        <ul className="sub-menu">
          {this.props.menuData[this.state.activeMenuIndex].subMenu.map((function(subMenu, index){
            return (
              <li className="sub-menu-item" key={index}>{subMenu}</li>
            );
          }))}
        </ul>
      </div>
    );
  }
});

export default Menu;