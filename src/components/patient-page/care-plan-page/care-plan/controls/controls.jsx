import React, { PropTypes } from 'react';
import classNames from 'classnames';
import Spinner from '../../../../spinner/spinner.jsx';
import Button from '../../../../button/button.jsx';
import Icon from '../../../../icon/icon.jsx';
import iconPrint from '../../../../../../svg/print.svg';
import iconEdit from '../../../../../../svg/edit.svg';
import detectcss from 'detectcss';
import './controls.scss';

const Controls = ({ editing, edit, openLightbox, saving, cancel, footer = false }) => {
  const controlClasses = classNames('controls', { 'controls--footer': footer });

  const cardClasses = classNames({
    controls__card: true,
    'controls__card--flipped': editing,
  });

  if (detectcss.feature('transform-style')) {
    console.log('supported');
  }

  const html = (
    <div className={controlClasses}>
      <div className={cardClasses}>
        <div className="controls__front">
          <Button
            onClick={edit}
            lvl3
            className="controls__button"
          >
            <Icon glyph={iconEdit} />
            <span className="button__text">Rediger</span>
          </Button>
          <Button
            lvl3
            className="controls__button"
          >
            <span className="button__text">Kopier til utklippstavlen</span>
          </Button>
          <Button
            className="controls__button controls__button--print"
            lvl3
            onClick={window.print}
          >
            <Icon glyph={iconPrint} />
            <span className="button__text">Skriv ut</span>
          </Button>
        </div>
        <div className="controls__back">
          {saving ? (<Spinner />) : null}
          <Button
            onClick={openLightbox}
            className="controls__button controls__button--save"
            disabled={saving}
          >
            Lagre
          </Button>
          <Button
            onClick={cancel}
            lvl2
            className="controls__button"
            disabled={saving}
          >
            Avbryt
          </Button>
        </div>
      </div>
    </div>
    );

  if (footer && editing || !footer) {
    return html;
  }

  return null;
};

Controls.propTypes = {
  editing: PropTypes.bool.isRequired,
  edit: PropTypes.func.isRequired,
  openLightbox: PropTypes.func.isRequired,
  saving: PropTypes.bool.isRequired,
  cancel: PropTypes.func.isRequired,
  footer: PropTypes.bool,
};

export default Controls;
