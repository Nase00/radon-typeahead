'use strict';
var React = require('react');
var cloneWithProps = require('react/lib/cloneWithProps');

var keyboard = {
  space: 32,
  enter: 13,
  escape: 27,
  tab: 9,
  upArrow: 38,
  downArrow: 40
};

var classBase = React.createClass({
  displayName: 'RadonSelect',
  propTypes: {
  },
  getDefaultProps () {
    return {
      list: [],
      onChange () {}
    };
  },
  getInitialState () {
    return {
      val: '',
      oldVal: '',
      selectedOptionIndex: false,
      listOpen: true
    };
  },
  hideList () {
    this.setState({
      listOpen: false
    });
  },
  onChange (ev) {
    this.setState({
      listOpen: true,
      selectedOptionIndex: false,
      val: ev.target.value
    });

    // This value won't have propagated to the DOM yet.
    // Could put this in the setState callback but this alerts the implementor faster
    this.props.onChange(ev.target.value);
  },
  resetOldVal () {
    this.setState({
      selectedOptionIndex: false,
      val: this.state.oldVal,
      oldVal: ''
    });
  },
  setNewSelectedIndex (index, oldVal) {
    var option = this.props.list[index];
    var state = {
      selectedOptionIndex: index,
      oldVal: typeof oldVal === 'undefined' ? this.state.oldVal : oldVal
    };

    // If it's not a string, or doesn't have a `value` property, we can't use it
    if (typeof option === 'string') {
      state.val = option;
    } else if (typeof option === 'object' && option.value) {
      state.val = option.value;
    }

    this.setState(state, function () {
      if (typeof this.props.onArrowNavigation === 'function') {
        this.props.onArrowNavigation(option, index);
      }
    });
  },
  moveIndexByOne (decrement) {
    var currentOption = this.state.selectedOptionIndex;
    var listLength = this.props.list.length;

    // keyboard navigation from the input
    if (currentOption === false) {
      // decrement wraps to the last value. Pass in current val to be cached
      this.setNewSelectedIndex(decrement ? listLength - 1 : 0, this.state.val);
    // keyboard navigation from an option
    } else {
      // Navigation off either end of the list
      if (decrement && currentOption === 0 || !decrement && currentOption === listLength - 1) {
        // Go back to the input and reset cached value
        this.resetOldVal();
      } else {
        this.setNewSelectedIndex(currentOption + (decrement ? -1 : 1));
      }
    }
  },
  // Arrow keys are only captured by onKeyDown not onKeyPress
  // http://stackoverflow.com/questions/5597060/detecting-arrow-key-presses-in-javascript
  onKeyDown (i, ev) {
    if (!this.props.list || this.props.list.length === 0) {
      return;
    }

    // escape always closes the list
    if (ev.keyCode === keyboard.escape) {
      ev.preventDefault();
      this.hideList();

      return;
    // Arrow keys behave similarly in the input and when option selected
    } else if (ev.keyCode === keyboard.upArrow || ev.keyCode === keyboard.downArrow) {
      ev.preventDefault();

      this.moveIndexByOne(/*decrement*/ ev.keyCode === keyboard.upArrow);
    // If they are on an option, tab, enter and escape have different behavior
    } else if (this.state.selectedOptionIndex !== false) {
      // Enter and tab behave like a click
      if (ev.keyCode === keyboard.tab || ev.keyCode === keyboard.enter) {
        ev.preventDefault();
        this.onClickOption(this.state.selectedOptionIndex);
      }
    }
  },
  onClickOption (index) {
    var option = this.props.list[index];
    var state = {
      listOpen: false,
      selectedOptionIndex: false
    };

    if (typeof option === 'string') {
      state.val = option;
    } else if (typeof option === 'object' && option.value) {
      state.val = option.value
    }

    this.setState(state);

    if (typeof this.props.onSelectOption === 'function') {
      this.props.onSelectOption(option, index);
    }
  },
  render () {
    return (
      <div>
        <input
          ref='input'
          value={this.state.val}
          onChange={this.onChange}
          onKeyDown={this.onKeyDown.bind(this, false)}
          onBlur={this.hideList} />
        {this.state.listOpen ?
          <div className='typeahead-list'>
            {this.props.list.map((item, i) => {
              var props = {
                children: {}
              };

              if (typeof item === 'string') {
                props.children = item;
              } else {
                props = item;
              }

              props.key = i;
              props.ref = i;
              props.onClick = this.onClickOption.bind(this, i);
              props.role = 'button';
              props.selected = i === this.state.selectedOptionIndex;
              props.tabIndex = -1;

              return cloneWithProps(
                this.props.listItemComponent || <div className={props.selected ? 'selected' : ''} />,
                props
              );
            })}
          </div>
          :
          ''
        }
      </div>
    );
  }
});

module.exports = classBase;