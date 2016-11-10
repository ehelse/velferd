import React, { PropTypes, Component } from 'react';
import './range.scss';
import Icon from '../../../icon/icon.jsx';
import pil from '../../../../../svg/pil-venstre.svg';
import Month from './month/month.jsx';

class Range extends Component {
  constructor(props) {
    super(props);
    this.scrollListener = this.scrollListener.bind(this);
    this.addPlaceholder = this.addPlaceholder.bind(this);
    this.removePlaceholder = this.removePlaceholder.bind(this);
    this.state = { sticky: false };
  }

  componentDidMount() {
    window.addEventListener('scroll', this.scrollListener);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.scrollListener);
  }

  addPlaceholder() {
    // get height of range element
    const height = this.refs.range.offsetHeight;
    // add placeholder element to keep the height in DOM
    const placeholder = document.createElement('div');
    placeholder.style.height = `${height}px`;
    placeholder.style.width = '100%';
    // store placeholder so it can be removed later
    this.setState({ placeholder });
    // insert placeholder
    this.refs.range.parentNode.insertBefore(this.state.placeholder, this.refs.range);
  }

  removePlaceholder() {
    this.state.placeholder.remove();
  }

  scrollListener() {
    if (window.scrollY > this.refs.range.offsetTop && !this.state.sticky) {
      this.setState({ sticky: true, offsetTop: this.refs.range.offsetTop });
      this.addPlaceholder();
      this.refs.range.classList.add('range--sticky');
    }
    else if (window.scrollY < this.state.offsetTop && this.state.sticky) {
      this.refs.range.classList.remove('range--sticky');
      this.removePlaceholder();
      this.setState({ sticky: false });
    }
  }

  render() {
    const {
      handleSingleBackClick,
      handleSingleForwardClick,
      fromDate,
      toDate,
      activeRange,
    } = this.props;

    const to = new Date(toDate.getTime());
    to.setDate(to.getDate() - 1);

    const months = [];
    for (let d = new Date(fromDate);
      d.getTime() < toDate.getTime(); d.setDate(d.getDate() + 1)) {
      if (months.indexOf(d.getMonth()) < 0) {
        months.push(d.getMonth());
      }
    }

    return (
      <nav className="range" ref="range">
        <div className="range__wrapper">
          <div className="range__controls">
            <button
              className="range__button range__button--rev"
              onClick={() => handleSingleBackClick()}
            >
              <Icon className="range__arrow" glyph={pil} width={51} height={51} />
              <span className="range__text--rev">Eldre</span>
            </button>
          </div>
          <div className="range__months">
            {months.map((month) =>
              <Month
                key={month}
                month={month}
                activeRange={activeRange}
                fromDate={fromDate}
                toDate={toDate}
              />
            )}
          </div>
          <div className="range__controls">
            <button
              className="range__button range__button--fwd"
              onClick={() => handleSingleForwardClick()}
            >
              <span className="range__text">Nyere</span>
              <Icon className="range__arrow--fwd" glyph={pil} width={51} height={51} />
            </button>
          </div>
        </div>
      </nav>
      );
  }
}

Range.propTypes = {
  handleSingleForwardClick: React.PropTypes.func.isRequired,
  handleSingleBackClick: React.PropTypes.func.isRequired,
  handleDateClick: PropTypes.func.isRequired,
  fromDate: PropTypes.instanceOf(Date).isRequired,
  toDate: PropTypes.instanceOf(Date).isRequired,
  selectedDate: PropTypes.instanceOf(Date),
  activeRange: PropTypes.number.isRequired,
};

export default Range;
