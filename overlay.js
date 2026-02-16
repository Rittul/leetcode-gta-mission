const video = document.getElementById('mission-video');

// Ensure video plays only ONCE
video.loop = false;

video.addEventListener('ended', () => {
  console.log('Video ended');
});

// Force play
video.play().catch(err => {
  console.log('Video autoplay prevented:', err);
});

// Fallback: Stop video after 4 seconds
setTimeout(() => {
  video.pause();
}, 4000);
