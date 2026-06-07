export function renderImage(props) {
  const imageUrl = props.imageUrl || props.src || '';
  return {
    type: 'image',
    imageUrl: imageUrl,
    commonImageWidth: props.width || props.commonImageWidth || undefined,
    maxWidth: props.width || props.maxWidth || undefined
  };
}
