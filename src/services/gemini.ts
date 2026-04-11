const formData = new FormData();
formData.append("file", audioBlob);

const res = await fetch("http://localhost:8000/analyze", {
  method: "POST",
  body: formData,
});

const data = await res.json();
