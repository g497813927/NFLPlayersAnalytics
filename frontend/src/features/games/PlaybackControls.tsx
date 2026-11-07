import { Button, Select, Slider } from 'antd';
import {
  PauseOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  StepForwardOutlined,
} from '@ant-design/icons';
import { MOCK_DRIVE } from './mockDrive';
import type { useMockGame } from './useMockGame';

export function PlaybackControls({ replay }: { replay: ReturnType<typeof useMockGame> }) {
  return (
    <div className="playback-controls">
      <div className="playback-buttons">
        <Button
          type="primary"
          icon={replay.playing ? <PauseOutlined /> : <PlayCircleOutlined />}
          disabled={replay.finished}
          onClick={replay.togglePlay}
        >
          {replay.playing ? 'Pause' : 'Play demo'}
        </Button>
        <Button
          icon={<StepForwardOutlined />}
          disabled={replay.finished}
          onClick={replay.next}
        >
          Next play
        </Button>
        <Button
          aria-label="Restart demo"
          title="Restart demo"
          icon={<ReloadOutlined />}
          onClick={replay.restart}
        />
        <Select
          aria-label="Playback speed"
          value={replay.speed}
          onChange={replay.setSpeed}
          options={[
            { value: 1, label: '1×' },
            { value: 2, label: '2×' },
          ]}
        />
      </div>
      <div className="playback-scrubber">
        <Slider
          min={0}
          max={MOCK_DRIVE.length - 1}
          value={replay.step}
          onChange={replay.seek}
          ariaLabelForHandle="Demo play"
          tooltip={{ formatter: (value) => `Play ${(value || 0) + 1} of ${MOCK_DRIVE.length}` }}
        />
        <span>
          {replay.step + 1} / {MOCK_DRIVE.length}
        </span>
      </div>
    </div>
  );
}
