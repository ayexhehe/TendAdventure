import footerImage from '../../assets/footer2.png'

export function Footer() {
  return (
    <footer className="absolute inset-x-0 bottom-0 z-0 flex flex-col items-center">
      <p className="pb-2 text-center text-xs text-white/80">
        &copy; {new Date().getFullYear()} Sangguniang Kabataan of Barangay Guadalupe
      </p>
      <div
        className="aspect-2000/135 w-full bg-bottom bg-no-repeat"
        style={{ backgroundImage: `url(${footerImage})`, backgroundSize: '100% auto' }}
      />
    </footer>
  )
}
