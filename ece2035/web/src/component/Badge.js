export const BadgeType = Object.freeze({
  SUCCESS: Symbol("success"),
  FAILED: Symbol("failed"),
  IN_PROGRESS: Symbol("in-progress"),
  NOT_STARTED: Symbol("not-started")
})

export default function Badge({ badgeType }) {

  const getBackgroundColor = () => {
    switch (badgeType) {
      case BadgeType.SUCCESS: return "#046c4e";
      case BadgeType.FAILED: return "#f05252";
      case BadgeType.IN_PROGRESS: return "#27272a";
      case BadgeType.NOT_STARTED: return "#27272a";
      default: return "";
    }
  }

  const getForegroundColor = () => {
    switch (badgeType) {
      case BadgeType.SUCCESS: return "#efefef";
      case BadgeType.FAILED: return "#efefef";
      case BadgeType.IN_PROGRESS: return "#efefef";
      case BadgeType.NOT_STARTED: return "#efefef";
      default: return "";
    }
  }

  const getText = () => {
    switch (badgeType) {
      case BadgeType.SUCCESS: return "Passed";
      case BadgeType.FAILED: return "Failed";
      case BadgeType.IN_PROGRESS: return "In Progress";
      case BadgeType.NOT_STARTED: return "Not Started";
      default: return "";
    }
  }

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      paddingLeft: "1.75rem",
      paddingRight: "1.75rem",
      height: "2rem",
      borderRadius: "2px",
      borderColor: getBackgroundColor(),
      backgroundColor: getBackgroundColor(),
      color: getForegroundColor(),
    }}>
      {getText()}
    </div>
  )
}