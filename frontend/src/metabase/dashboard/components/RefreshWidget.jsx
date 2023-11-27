import MetabaseSettings from "metabase/lib/settings";
/* eslint-disable react/prop-types */
import { createRef, Component } from "react";

import { t } from "ttag";
import PopoverWithTrigger from "metabase/components/PopoverWithTrigger";
import Tooltip from "metabase/core/components/Tooltip";
import CountdownIcon from "metabase/components/icons/CountdownIcon";

import { DashboardHeaderButton } from "metabase/dashboard/containers/DashboardHeader.styled";
import {
  RefreshOptionIcon,
  RefreshOptionItem,
  RefreshWidgetPopover,
  RefreshWidgetTitle,
} from "./RefreshWidget.styled";

const CUSTOM_REFRESH_OPTIONS =  () => MetabaseSettings.get("custom-dashboard-refresh-options");

const OPTIONS = [
  { name: t`Off`, period: null },
  { name: t`1 minute`, period: 1 * 60 },
  { name: t`5 minutes`, period: 5 * 60 },
  { name: t`10 minutes`, period: 10 * 60 },
  { name: t`15 minutes`, period: 15 * 60 },
  { name: t`30 minutes`, period: 30 * 60 },
  { name: t`60 minutes`, period: 60 * 60 },
];

const getPeriodNameFromSeconds = (seconds) => {
  let timeUnit;
  let count = seconds;
  if(!seconds) return t`Off`;
  if (seconds == 1) return "1 second" // t`second`;
  if (seconds <= 60) {
    timeUnit = "seconds"; // t`seconds`;
    count = seconds;
  }
  else if (seconds <= 60*60){
    timeUnit = "minutes"; // t`minutes`;
    count = seconds/60;
  }
  else if (seconds <= 24*60*60){
    timeUnit = "hours"; // t`hours`;
    count = seconds/(60*60);
  }
  else if (seconds <= 365*24*60*60){
    timeUnit = "days"; // t`days`;
    count = seconds/(24*60*60);
  }
  else {
    timeUnit = "years"; // t`years`;
    count = seconds/(365*24*60*60);
  }
  // doesn't support rtl languages...
  return `${Math.round(count)} ${timeUnit}`;
}

const getCustomOptionsFromSettings = () => {
  const customOptions = CUSTOM_REFRESH_OPTIONS();
  if(!customOptions) return null;
  const secondsToPeriodOption = (seconds) => {
    const period = Number.parseInt(seconds);
    const name = getPeriodNameFromSeconds(period);
    return { name, period };
  };
  return customOptions.split(" ").map(secondsToPeriodOption);
};

export default class RefreshWidget extends Component {
  constructor(props) {
    super(props);

    this.popover = createRef();
  }
  state = { elapsed: null };

  UNSAFE_componentWillMount() {
    const { setRefreshElapsedHook } = this.props;
    if (setRefreshElapsedHook) {
      setRefreshElapsedHook(elapsed => this.setState({ elapsed }));
    }
  }

  componentDidUpdate(prevProps) {
    const { setRefreshElapsedHook } = this.props;
    if (
      setRefreshElapsedHook &&
      prevProps.setRefreshElapsedHook !== setRefreshElapsedHook
    ) {
      setRefreshElapsedHook(elapsed => this.setState({ elapsed }));
    }
  }

  render() {
    const { period, onChangePeriod } = this.props;
    const { elapsed } = this.state;
    const remaining = period - elapsed;
    return (
      <PopoverWithTrigger
        ref={this.popover}
        triggerElement={
          elapsed == null ? (
            <Tooltip tooltip={t`Auto-refresh`}>
              <DashboardHeaderButton
                icon="clock"
                aria-label={t`Auto Refresh`}
              />
            </Tooltip>
          ) : (
            <Tooltip
              tooltip={
                t`Refreshing in` +
                " " +
                Math.floor(remaining / 60) +
                ":" +
                (remaining % 60 < 10 ? "0" : "") +
                Math.round(remaining % 60)
              }
            >
              <DashboardHeaderButton
                icon={
                  <CountdownIcon
                    width={16}
                    height={16}
                    percent={Math.min(0.95, (period - elapsed) / period)}
                  />
                }
                aria-label={t`Auto Refresh`}
              />
            </Tooltip>
          )
        }
        targetOffsetY={10}
      >
        <RefreshWidgetPopover>
          <RefreshWidgetTitle>{t`Auto Refresh`}</RefreshWidgetTitle>
          <RefreshOptionList>
            {(getCustomOptionsFromSettings() ?? OPTIONS).map(option => (
              <RefreshOption
                key={option.period}
                name={option.name}
                period={option.period}
                selected={option.period === period}
                onClick={() => {
                  this.popover.current.close();
                  onChangePeriod(option.period);
                }}
              />
            ))}
          </RefreshOptionList>
        </RefreshWidgetPopover>
      </PopoverWithTrigger>
    );
  }
}

const RefreshOptionList = ({ children }) => <ul>{children}</ul>;

const RefreshOption = ({ name, period, selected, onClick }) => (
  <RefreshOptionItem
    isEnabled={period != null}
    isSelected={selected}
    onClick={onClick}
  >
    <RefreshOptionIcon name="check" />
    <span>{name}</span>
  </RefreshOptionItem>
);
