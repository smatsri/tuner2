import { Grid } from "./components/Grid.js";
import { FrequencyRuler } from "./components/FrequencyRuler.js";
import { Layout } from "./components/Layout.js";

export const render = (view, ctx, canvas, state = {}) => {
  view.forEach(([component, children]) => {
    component(ctx, canvas, state);

    if (children) {
      children.forEach((child) => {
        if (Array.isArray(child)) {
          render(child, ctx, canvas, state);
        } else {
          child(ctx, canvas, state);
        }
      });
    }
  });
};

export const View = ({ targetFrequency, data }) => [
  [
    Layout,
    [
      Grid({}),
      // Bars({
      //   data,
      // }),
      FrequencyRuler({ targetFrequency }),
    ],
  ],
];
