import React, { PropTypes } from 'react';
import TextInput from '../text-input/text-input.jsx';

import './goal.scss';

const Goal = ({
    edit,
    onChange,
    patientGoal,
    saving,
  }) => {
  const getGoal = () => {
    if (edit) {
      return (
        <TextInput
          onChange={onChange}
          name="patient-goal"
          value={patientGoal}
          disabled={saving}
        />
      );
    }
    return (<span>"{patientGoal}"</span>);
  };

  return (
    <div className="goal">
      <div className="goal__left">
        <h3 className="goal__heading">Overordnet mål</h3>
        {getGoal()}
      </div>
      <span>Sist oppdatert 21.11.2015</span>
    </div>
  );
};

Goal.propTypes = {
  patientGoal: PropTypes.string,
  edit: PropTypes.bool.isRequired,
  onChange: React.PropTypes.func,
  saving: React.PropTypes.bool,
};

export default Goal;
