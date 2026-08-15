// @tempo-home — Tempo home canvas (the workspace Run button opens this). Managed marker; do not remove.
import { Canvas, RouteStoryboard } from "tempo-sdk/canvas";

export default function RadarioDashboardCanvas() {
  return (
    <Canvas name="Radario Dashboard">
      <RouteStoryboard
        id="Dashboard"
        name="Today’s Job Radar"
        route="/"
        layout={{ x: 0, y: 0, width: 1440, height: 1100 }}
      />
    </Canvas>
  );
}
