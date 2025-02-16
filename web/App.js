const RB = ReactBootstrap;
const { Alert, Card, Button, Form, Modal } = ReactBootstrap;

class App extends React.Component {
    state = {
        user: null,
        classes: [],
        showAddClassModal: false,
        newClassName: "",
        image: null,
        url: "",
        progress: 0,
    };

    handleChange = (e) => {
        if (e.target.files[0]) {
            const image = e.target.files[0];
            this.setState(() => ({ image }));
        }
    };

    handleUpload = async () => {
        const { image } = this.state;
        const formData = new FormData();
        formData.append('image', image);
        const response = await fetch('https://api.imgur.com/3/image', {
            method: 'POST',
            headers: {
              Authorization: '5773d40476e80e1',
            },
            body: formData,
          });
        
          const data = await response.json();
          if (response.status != 200 || !data.data.link.includes("imgur")) {
            console.log("error can't up load:"+response.status)
            return
          }
          console.log(response.status)
          console.log(data.data.link)
          this.setState({url:data.data.link})
    };

    

    componentDidMount() {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                this.setState({ user: user.toJSON() });
                this.fetchClasss(user.uid);
            } else {
                this.setState({ user: null, classes: [] });
            }
        });
    }

    fetchClasss(userId) {
        db.collection("classroom")
            .where("owner", "==", userId)
            .onSnapshot((snapshot) => {
                const classes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                this.setState({ classes });
            });
    }

    google_login() {
        var provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope("profile");
        provider.addScope("email");
    
        firebase.auth().signInWithPopup(provider)
            .then((result) => {
                const user = result.user;
    
                if (user) {
                    const userRef = db.collection("user").doc(user.uid);
    
                    userRef.get().then((doc) => {
                        if (!doc.exists) {
                            userRef.set({
                                uid: user.uid,
                                name: user.displayName,
                                email: user.email,
                                photoURL: user.photoURL,
                                createdAt: firebase.firestore.FieldValue.serverTimestamp()
                            });
                        }
                        
                        this.setState({ user: user.toJSON() });
                        this.fetchClasss(user.uid);
                    }).catch((error) => {
                        console.error("Error checking user by UID:", error);
                    });
                }
            })
            .catch((error) => {
                console.error("Error logging in:", error);
            });
    }
    
    google_logout() {
        if (confirm("Are you sure?")) {
            firebase.auth().signOut().then(() => {
                this.setState({ user: null, classes: [] });
            });
        }
    }

    addClass() {
        this.setState({ showAddClassModal: true });
    }

    deleteClass(courseId) {
        if (confirm("Are you sure you want to delete this course?")) {
            db.collection("classroom").doc(courseId).delete()
                .then(() => {
                    console.log("Class deleted from Firestore.");
                })
                .catch((error) => {
                    console.error("Error deleting class:", error);
                });
        }
    }

    handleClassSubmit = () => {
        if (this.state.newClassName && this.state.user) {
            db.collection("classroom").add({
                name: this.state.newClassName,
                owner: this.state.user.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                console.log("Class added to Firestore.");
            }).catch((error) => {
                console.error("Error adding class:", error);
            });

            this.setState({ showAddClassModal: false, newClassName: "" });
        }
    };

    render() {
        return (
            <Card>
                <Card.Header>Classroom Management</Card.Header>
                <Card.Body>
                    <LoginBox user={this.state.user} app={this} />
                    {this.state.user && (
                        <div>
                            <h3>{this.state.user.displayName}</h3>
                            <img src={this.state.user.photoURL} width="50" height="50" alt="Profile" />
                            <p>{this.state.user.email}</p>
                            <Button variant="primary" onClick={() => this.addClass()}>Add Class</Button>
                            <h4 className="mt-3">My Classes</h4>
                            <ul>
                                {this.state.classes.map(course => (
                                    <li key={course.id}>
                                        {course.name}
                                        <Button size="sm" onClick={() => alert("Manage: " + course.name)}>Manage</Button>
                                        <Button size="sm" variant="danger" className="mx-2" onClick={() => this.deleteClass(course.id)}>Delete</Button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </Card.Body>
                <Card.Footer>Footer Information</Card.Footer>

                <input type="file" onChange={this.handleChange} />
                <button onClick={this.handleUpload}>Upload</button>
                <br />
                {this.state.url && (
                    <img
                        src={this.state.url}
                        alt="Uploaded"
                        style={{ width: "300px", marginTop: "10px" }}
                    />
                )}

                {/* Add Class Modal */}
                <Modal show={this.state.showAddClassModal} onHide={() => this.setState({ showAddClassModal: false })}>
                    <Modal.Header closeButton>
                        <Modal.Title>Add New Class</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form>
                            <Form.Group>
                                <Form.Label>Class Name</Form.Label>
                                <Form.Control type="text" value={this.state.newClassName} onChange={(e) => this.setState({ newClassName: e.target.value })} />
                            </Form.Group>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => this.setState({ showAddClassModal: false })}>Cancel</Button>
                        <Button variant="primary" onClick={this.handleClassSubmit}>Add</Button>
                    </Modal.Footer>
                </Modal>
            </Card>
        );
    }
}

function LoginBox({ user, app }) {
    if (!user) {
        return <Button onClick={() => app.google_login()}>Login</Button>;
    } else {
        return (
            <div>
                <Button onClick={() => app.google_logout()}>Logout</Button>
            </div>
        );
    }
}

const container = document.getElementById("webapp");
const root = ReactDOM.createRoot(container);
root.render(<App />);

const firebaseConfig = {
    apiKey: "AIzaSyDriZHkql1Yp-F-Fg8_b5rpDDskobHIqJU",
    authDomain: "webproject-51262.firebaseapp.com",
    projectId: "webproject-51262",
    storageBucket: "webproject-51262.firebasestorage.app",
    messagingSenderId: "318273993725",
    appId: "1:318273993725:web:f63b3ac40ab995131e3794",
    measurementId: "G-YMQK2EXYY5"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();
const storageRef = storage.ref();
