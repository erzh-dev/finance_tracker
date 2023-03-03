const colors = {
  light: {
    background: '#0f0f58',
    text: 'white',
    test: 'red',
  },
  dark: {
    background: 'white',
    text: '#0f0f58',
    test: 'yellow',
  },
};

export const theming = (cb: (allCollor: typeof colors.dark) => void) =>
  Object.keys(colors).reduce(
    (acc, name) =>
      Object.assign(acc, {
        [`.theme-${name} &`]: cb(colors[name]),
      }),
    {},
  );
