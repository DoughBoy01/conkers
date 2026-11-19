import React from "react";
import { RotateCcw } from "lucide-react";

interface StageErrorBoundaryProps {
  resetKey: string;
  onReset: () => void;
  children: React.ReactNode;
}

interface StageErrorBoundaryState {
  hasError: boolean;
}

export class StageErrorBoundary extends React.Component<
  StageErrorBoundaryProps,
  StageErrorBoundaryState
> {
  public state: StageErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): StageErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidUpdate(prevProps: StageErrorBoundaryProps): void {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  private handleRecover = (): void => {
    this.setState({ hasError: false });
    this.props.onReset();
  };

  public render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="relative flex w-full aspect-video flex-col items-center justify-center rounded-xl border border-ink/15 bg-parchment p-8 text-center shadow-sm">
          <p className="font-mono text-xs font-medium text-chestnut">
            Stage Interrupted
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-ink">
            Something went awry on the village green
          </h2>
          <p className="mt-2 max-w-md text-sm text-bark">
            Reset the stage to string a fresh conker and continue watching or playing.
          </p>
          <button
            type="button"
            onClick={this.handleRecover}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-chestnut px-4 py-2 text-xs font-semibold text-vellum transition-colors hover:bg-chestnut-deep cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Stage
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
