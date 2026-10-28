import { Composition } from "remotion";
import { Video, duracaoFinal } from "./Video";
import { FPS } from "./tempo";

export const Root = () => (
  <Composition id="Video" component={Video} width={1080} height={1920} fps={FPS} durationInFrames={Math.max(1, Math.round(duracaoFinal() * FPS))} />
);
