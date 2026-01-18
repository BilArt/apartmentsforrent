import styles from "./Button.module.scss";

function Button({
  children,
  variant = "primary",
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className = "",
  ...rest
}) {
  const classes = [styles.button, styles[variant], className]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} {...rest}>
      {LeftIcon && <LeftIcon className={styles.icon} aria-hidden="true" />}
      <span className={styles.label}>{children}</span>
      {RightIcon && <RightIcon className={styles.icon} aria-hidden="true" />}
    </button>
  );
}

export default Button;
