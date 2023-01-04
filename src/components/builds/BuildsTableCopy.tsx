import { memo, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeProvider } from '@emotion/react';
import { createFragmentContainer, requestSubscription } from 'react-relay';
import cx from 'classnames';
import { useRecoilValue } from 'recoil';
import { graphql } from 'babel-plugin-relay/macro';
import environment from '../../createRelayEnvironment';

import { useTheme } from '@mui/material';
import { WithStyles } from '@mui/styles';
import { Link } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import withStyles from '@mui/styles/withStyles';
import InfoIcon from '@mui/icons-material/Info';
import CommitIcon from '@mui/icons-material/Commit';
import Typography from '@mui/material/Typography';
import createStyles from '@mui/styles/createStyles';
import CallSplitIcon from '@mui/icons-material/CallSplit';

import BuildStatusChipNew from '../chips/BuildStatusChipNew';
import { muiThemeOptions } from '../../cirrusTheme';
import { shorten } from '../../utils/text';
import { absoluteLink } from '../../utils/link';
import { formatDuration } from '../../utils/time';
import { isBuildFinalStatus } from '../../utils/status';
import { navigateBuildHelper } from '../../utils/navigateHelper';

import { BuildsTable_builds } from './__generated__/BuildsTable_builds.graphql';

import BookOutlinedIcon from '@mui/icons-material/BookOutlined';

import Chip from '@mui/material/Chip';
import { FormatUnderlined, HeightSharp } from '@mui/icons-material';

// todo: move custom values to mui theme adjustments
const styles = theme =>
  createStyles({
    row: {
      display: 'flex',
      padding: '16px',
      alignItems: 'center',
      // justifyContent: 'space-between',
      height: 82,
      cursor: 'pointer',
      background: theme.palette.background.paper,
      // border: '1px solid #00000014',
      boxShadow: 'rgba(0, 0, 0, 0.1) 0px 0px 5px 0px, rgba(0, 0, 0, 0.1) 0px 0px 1px 0px',
      borderRadius: '6px',
      margin: '4px 0',
    },
    cell: {
      fontSize: 16,
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      '& *': {
        fontSize: '16px !important',
      },
    },
    cellStatus: {
      width: 150,
      minWidth: 150,
      maxWidth: 150,
    },
    cellStatusChip: {
      '& *': {
        fontSize: '15px !important',
        color: theme.palette.background.default,
      },
    },
    cellRepository: {
      width: 180,
      minWidth: 180,
      maxWidth: 180,
    },
    cellCommit: {},
    cellBranch: {
      width: 180,
      minWidth: 180,
      maxWidth: 180,
    },
    cellDuration: {
      width: 110,
      minWidth: 110,
      maxWidth: 110,
      textAlign: 'right',
    },
    infoIcon: {
      color: theme.palette.action.active,
    },
    commitName: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 1,
      WebkitBoxOrient: 'vertical',
      whiteSpace: 'normal',
    },
    hash: {
      color: theme.palette.text.secondary,
      fontFamily: 'Courier',
      marginTop: theme.spacing(0.5),
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: 3 * theme.shape.borderRadius,
      width: 'fit-content',
      padding: '1px 5px',
      '& *': { fontSize: '14px !important' },
    },
  });

const styled = withStyles(styles);

interface Props extends WithStyles<typeof styles> {
  builds: BuildsTable_builds;
  selectedBuildId?: string;
  setSelectedBuildId?: Function;
}

const buildSubscription = graphql`
  subscription BuildsTableSubscription($buildID: ID!) {
    build(id: $buildID) {
      ...BuildsTable_builds
    }
  }
`;

const BuildsTable = styled(({ classes, builds = [], selectedBuildId, setSelectedBuildId }: Props) => {
  const themeOptions = useRecoilValue(muiThemeOptions);
  const muiTheme = useMemo(() => createTheme(themeOptions), [themeOptions]);

  return (
    <ThemeProvider theme={muiTheme}>
      <div style={{}}>
        <div style={{ display: 'flex', padding: '10px', background: '#80808029', color: 'grey' }}>
          <div style={{ width: '317px' }}>Status</div>
          <div style={{ width: '333px' }}>Repository</div>
          <div style={{ width: '100%' }}>Commit</div>
          <div style={{ width: '100px' }}>Branch</div>
          <div style={{ width: '' }}>Duration</div>
        </div>
        {builds.map((build, i) => (
          <BuildRow
            key={build.id}
            build={build}
            selected={selectedBuildId === build.id}
            setSelectedBuildId={setSelectedBuildId}
          />
        ))}
      </div>
    </ThemeProvider>
  );
});

interface BuildRowProps extends WithStyles<typeof styles> {
  build: BuildsTable_builds[number];
  selected?: boolean;
  setSelectedBuildId?: Function;
}

const BuildRow = styled(
  memo(({ classes, build, selected, setSelectedBuildId }: BuildRowProps) => {
    const theme = useTheme();
    const navigate = useNavigate();

    const isFinalStatus = useMemo(() => isBuildFinalStatus(build.status), [build.status]);
    useEffect(() => {
      if (isFinalStatus) return;
      const subscription = requestSubscription(environment, {
        subscription: buildSubscription,
        variables: { buildID: build.id },
      });
      return () => {
        subscription.dispose();
      };
    }, [build.id, isFinalStatus]);

    let rowProps;
    const selectable = !!setSelectedBuildId;
    if (selectable) {
      rowProps = {
        selected: selected,
        onMouseEnter() {
          if (selected) return;
          setSelectedBuildId(build.id);
        },
        onMouseLeave() {
          setSelectedBuildId(null);
        },
      };
    } else {
      rowProps = {
        hover: true,
      };
    }

    return (
      <div
        className={classes.row}
        {...rowProps}
        onClick={e => {
          const target = e.target as HTMLElement;
          if (target.closest('a')) return;
          navigateBuildHelper(navigate, e, build.id);
        }}
      >
        {/* STATUS */}
        <div style={{ maxWidth: '100px' }} className={cx(classes.cell, classes.cellStatus, classes.cellStatusChip)}>
          <BuildStatusChipNew status={build.status} />
        </div>
        {/* REPOSITORY */}
        <div style={{ width: '100px' }} className={cx(classes.cell, classes.cellRepository)}>
          <Chip
            label={`${build.repository.name}`}
            variant="filled"
            color="default"
            size="small"
            icon={<BookOutlinedIcon />}
            clickable
            sx={{
              '& .MuiChip-iconSmall': {
                marginLeft: '5px',
              },
            }}
          />

          {/* <Stack direction="row" alignItems="center" spacing={0.5}>
            <BookOutlinedIcon fontSize="inherit" />
            <Link
              href={absoluteLink(build.repository.platform, build.repository.owner, build.repository.name)}
              underline="hover"
              noWrap
              title={build.repository.name}
            >
              {build.repository.name}
            </Link>
          </Stack>
          <Typography noWrap color={theme.palette.text.secondary} title={build.repository.owner}>
            by {build.repository.owner}
          </Typography> */}
        </div>
        {/* COMMIT */}
        <div style={{ width: '100%' }} className={cx(classes.cell, classes.cellCommit)}>
          <Typography className={classes.commitName} title={build.changeMessageTitle}>
            {build.changeMessageTitle}
          </Typography>
          {/* HASH */}
          <Tooltip title="Click to copy">
            <Chip
              label={build.changeIdInRepo.substr(0, 7)}
              variant="filled"
              color="default"
              size="small"
              icon={<CommitIcon />}
              clickable
              title="click to copy"
              sx={{
                '& .MuiChip-iconSmall': {
                  marginLeft: '5px',
                },
                fontFamily: 'Courier',
                marginTop: 1,
              }}
            />
          </Tooltip>

          {/* <Stack className={classes.hash} direction="row" alignItems="center" spacing={0.5}>
            <CommitIcon fontSize="inherit" />
            <span>{build.changeIdInRepo.substr(0, 7)}</span>
          </Stack> */}
        </div>
        {/* BRANCH */}
        <div style={{ width: '100px' }} className={cx(classes.cell, classes.cellBranch)}>
          <Chip
            label={shorten(build.branch)}
            variant="filled"
            color="default"
            size="small"
            icon={<CallSplitIcon />}
            clickable
            sx={{
              '& .MuiChip-iconSmall': {
                marginLeft: '5px',
              },
            }}
          />

          {/* <Stack direction="row" alignItems="center" spacing={0.5}>
            <CallSplitIcon fontSize="inherit" />
            <Link
              href={absoluteLink(
                build.repository.platform,
                build.repository.owner,
                build.repository.name,
                build.branch,
              )}
              underline="hover"
              noWrap
              title={build.branch}
            >
              {shorten(build.branch)}
            </Link>
          </Stack> */}
        </div>
        {/* DURATION */}
        <div className={cx(classes.cell, classes.cellDuration)}>
          {build.clockDurationInSeconds ? formatDuration(build.clockDurationInSeconds) : '—'}
        </div>
      </div>
    );
  }),
);

export default createFragmentContainer(BuildsTable, {
  builds: graphql`
    fragment BuildsTable_builds on Build @relay(plural: true) {
      id
      branch
      status
      changeIdInRepo
      changeMessageTitle
      clockDurationInSeconds
      repository {
        platform
        owner
        name
      }
    }
  `,
});
