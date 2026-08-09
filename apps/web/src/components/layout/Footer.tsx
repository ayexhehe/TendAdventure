import footerImage from '../../assets/footer.svg'

export function Footer() {
  return (
    <footer
      className="relative aspect-5/1 w-full bg-bottom bg-no-repeat"
      style={{ backgroundImage: `url(${footerImage})`, backgroundSize: '100% auto' }}
    >
      <p
        className="absolute inset-x-0 text-center text-xs text-white/80"
        style={{ bottom: '55%' }}
      >
        &copy; {new Date().getFullYear()} Linggo ng Kabataan sa Guadalupe
      </p>
    </footer>
  )
}
