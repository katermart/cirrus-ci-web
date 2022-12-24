import Chip from '@mui/material/Chip';
import Icon from '@mui/material/Icon';
import StopCircleOutlinedIcon from '@mui/icons-material/StopCircleOutlined';

import { BuildStatus } from './__generated__/BuildStatusChip_build.graphql';

interface Props {
  status: BuildStatus;
  mini?: boolean;
}

function BuildStatusChip({ status, mini = false }: Props) {
  const label =
    {
      CREATED: 'created',
      EXECUTING: 'executing',
      COMPLETED: 'completed',
      FAILED: 'failed',
      ABORTED: 'aborted',
    }[status] || status.toLowerCase();

  const color =
    {
      TRIGGERED: 'info',
      CREATED: 'secondary',
      EXECUTING: 'info',
      COMPLETED: 'success',
      FAILED: 'error',
      ABORTED: 'warning',
    }[status] || 'error';

  const IconName =
    {
      TRIGGERED: 'play_circle_outlined',
      CREATED: 'cloud_circle_outlined',
      EXECUTING: 'play_circle_outlined',
      COMPLETED: 'check_circle_outlined',
      FAILED: 'error_outline_outlined',
      ABORTED: StopCircleOutlinedIcon, // mui shows wrong icon with the name 'stop_circle_outlined'
    }[status] || 'error_outline_outlined';

  if (mini) {
    return typeof IconName === 'string' ? <Icon color={color}>{IconName}</Icon> : <IconName color={color} />;
  }

  return (
    <Chip
      label={label}
      color={color}
      size="small"
      variant="outlined"
      icon={typeof IconName === 'string' ? <Icon>{IconName}</Icon> : <IconName />}
      sx={{
        '& .MuiChip-iconSmall': {
          marginLeft: '5px',
        },
      }}
    ></Chip>
  );
}

export default BuildStatusChip;
