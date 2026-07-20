import React from 'react';
import FunctionPlotter from './widgets/FunctionPlotter';
import ProjectileMotion from './widgets/ProjectileMotion';
import SpringMass from './widgets/SpringMass';
import UnitConverter from './widgets/UnitConverter';

const widgetComponents = {
  function_plotter: FunctionPlotter,
  projectile_motion: ProjectileMotion,
  spring_mass: SpringMass,
  unit_converter: UnitConverter,
};

const InteractiveWidgetBlock = ({ block }) => {
  const Widget = widgetComponents[block.widget_type];
  if (!Widget) {
    return (
      <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-lg p-4 text-yellow-300 text-sm">
        Unknown widget type: <code className="bg-black/30 px-1 rounded">{block.widget_type}</code>
      </div>
    );
  }

  return (
    <div className="my-2">
      <Widget config={block.config || {}} />
    </div>
  );
};

export default InteractiveWidgetBlock;
