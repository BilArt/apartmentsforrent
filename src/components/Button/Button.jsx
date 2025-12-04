import styles from './Button.module.scss'

function Button({ children, variant = 'primary', ...rest}) {
    const classNames = [styles.button, styles[variant]].join(' ')

    return (
        <button className={classNames} {...rest}>
            {children}
        </button>
    )
}

export default Button