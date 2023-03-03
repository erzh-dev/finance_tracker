import React from 'react';

export class ErrorBoundary extends React.Component<
  Record<string, unknown>,
  { hasError: boolean; error: string; errorInfo: string }
> {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: '', errorInfo: '' };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.log(error, errorInfo);
    this.setState((prev) => ({
      ...prev,
      error: error.message,
      errorInfo: errorInfo.componentStack,
    }));
  }

  render() {
    if (this.state.hasError) {
      console.log(this.state);
      return (
        <div>
          <h1>
            Упс, случилось что-то неожиданное, и приложение вынуждено было
            упасть
          </h1>
          <br />
          <article>
            <h3>Вот такая ошибка</h3>
            <br />
            <p>{this.state.error}</p>
            <br />
            <h3>А вот детальная инфа по ней</h3>
            <pre>{this.state.errorInfo}</pre>
          </article>
        </div>
      );
    }

    return this.props.children;
  }
}
