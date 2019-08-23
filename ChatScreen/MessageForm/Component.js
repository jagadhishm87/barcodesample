import React, { Component } from 'react'
import { View, TextInput, TouchableOpacity, Linking,StyleSheet,Platform } from 'react-native'
import styles from './Styles'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faPaperPlane, faMicrophone, faCamera } from '@fortawesome/free-solid-svg-icons';
import { Constants, ImagePicker, Permissions, FileSystem, MediaLibrary  } from 'expo'; 
import {KeyboardAvoidingView} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
const keyboardVerticalOffset = Platform.OS === 'ios' ? 40 : 0;

class MessageFormComponent extends Component {

    constructor() {
        super()
        this.state = {
            userMessageText: '',
            scanned: false,
            hasCameraPermission: null
        }
    }

    render() {
        const { hasCameraPermission, scanned } = this.state;
        return (
            <KeyboardAvoidingView style={{flex: 1}} keyboardVerticalOffset={keyboardVerticalOffset} behavior={"padding"} enabled>
            <ScrollView>
            <View style={styles.messageRequesterStyle}>
                <TextInput
                    ref={input => { this.textInput = input }}
                    placeholder="Type a message here"
                    onChangeText={data => this.setState({ userMessageText: data })}
                    style={styles.textInputStyle}
                    underlineColorAndroid='transparent'
                />
                <TouchableOpacity onPress={this.OnInputSubmit} activeOpacity={0.7}>
                    {this.renderImage()}
                </TouchableOpacity>
                <TouchableOpacity onPress={this._takePhoto} activeOpacity={0.7}>
                    <View style={styles.ImageIconStyle}>
                        <FontAwesomeIcon color='#35C3CF' icon={faCamera} />
                    </View>
                </TouchableOpacity>         
            </View>
            </ScrollView>
            </KeyboardAvoidingView>
   
        )
    }

    OnInputSubmit = () => {
        if (this.textInput != undefined)
            this.textInput.clear()
        this.props.OnInputSubmit(this.state.userMessageText)
        this.setState({ userMessageText: '' })
        this.renderImage
    }

    TakePicture = (picture) => {
        this.props.TakePicture(picture.uri);
        this.setState({ userMessageText: '' })
        this.renderImage
    }


    renderImage = () => {
        if (this.state.message != '') {
            return (
                <View style={styles.ImageIconStyle}>
                    <FontAwesomeIcon color='#35C3CF' icon={faPaperPlane} />
                </View>
            )
        } else {
            return (
                <View style={styles.ImageIconStyle}>
                    <FontAwesomeIcon color='#35C3CF' icon={faMicrophone} />
                </View>
            )
        }
    }

    _takePhoto = async () => {
        const {
            status: cameraPerm
        } = await Permissions.askAsync(Permissions.CAMERA);

        const {
            status: cameraRollPerm
        } = await Permissions.askAsync(Permissions.CAMERA_ROLL);

        // only if user allows permission to camera AND camera roll
        if (cameraPerm === 'granted' && cameraRollPerm === 'granted') {
            let pickerResult = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
            });
            pickerResult.BarCodeScanner = this.handleBarCodeScanned;
            if (pickerResult.cancelled != true)
                this.TakePicture(pickerResult);
            return this._handleImagePicked(pickerResult);
        }
    };

    _handleImagePicked = async pickerResult => {
        let uploadResponse, uploadResult;

        try {
            this.setState({
                uploading: true
            });

            if (!pickerResult.cancelled) {

                await this.snap(pickerResult.uri);

                // uploadResponse = await this.uploadImageAsync(pickerResult.uri);
                // uploadResult = await uploadResponse.json();

                // alert("File is uploaded to " + Linking.openURL(uploadResult.location));

                // this.setState({
                //     userMessageText: uploadResult.location
                // });
            }
        } catch (e) {
            console.log({ uploadResponse });
            console.log({ uploadResult });
            console.log({ e });
            alert('Upload failed, sorry :(');
        } finally {
            this.setState({
                uploading: false
            });
        }
    };

    async uploadImageAsync(uri) {
        let apiUrl = 'http://192.168.43.124:8080/upload';

        // Note:
        // Uncomment this if you want to experiment with local server
        //
        // if (Constants.isDevice) {
        //   apiUrl = `https://your-ngrok-subdomain.ngrok.io/upload`;
        // } else {
        //   apiUrl = `http://localhost:3000/upload`
        // }

        let uriParts = uri.split('.');
        let fileType = uriParts[uriParts.length - 1];

        let formData = new FormData();
        formData.append('uri', {
            uri,
            name: `photo.${fileType}`,
            type: `image/${fileType}`,
        });

        let options = {
            method: 'POST',
            body: formData,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'multipart/form-data',
            },
        };

        const response = fetch(apiUrl, options);
        console.log(response);
        return response;
    }

    snap = async (uri) => {
        console.log("Snapping!")
        console.log("Reading!")
        const fileString = await FileSystem.readAsStringAsync(uri)
        console.log(fileString.length)
        console.log('Writing!')
        await FileSystem.writeAsStringAsync(`${FileSystem.documentDirectory}tmpimg.jpg`, fileString)
        console.log("Saving!")
        await MediaLibrary.createAssetAsync(`${FileSystem.documentDirectory}tmpimg.jpg`);
        await MediaLibrary.createAssetAsync(uri);

    };

    async componentDidMount() {
        this.getPermissionsAsync();
      }

      getPermissionsAsync = async () => {
        const { status } = await Permissions.askAsync(Permissions.CAMERA);
        this.setState({ hasCameraPermission: status === 'granted' });
      };

      handleBarCodeScanned = ({ type, data }) => {
        this.setState({ scanned: true });
        alert(`Bar code with type ${type} and data ${data} has been scanned!`);
      };
}

export default MessageFormComponent;
