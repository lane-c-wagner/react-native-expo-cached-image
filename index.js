import React, {Component} from 'react';
import {View, Image, ImageBackground, ActivityIndicator} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';

export default class CachedImage extends Component {
    state = {
        imgURI: '',
        loading: true,
    }

    async componentDidMount() {
        const filesystemURI = await this.getImageFilesystemKey(this.props.source.uri);
        await this.loadImage(filesystemURI, this.props.source.uri);
    }

    async componentDidUpdate() {
        const filesystemURI = await this.getImageFilesystemKey(this.props.source.uri);
        if (this.props.source.uri === this.state.imgURI ||
            filesystemURI === this.state.imgURI) {
            return null;
        }
        await this.loadImage(filesystemURI, this.props.source.uri);
    }

    async getImageFilesystemKey(remoteURI) {
        const hashed = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            remoteURI
        );
        return `${FileSystem.cacheDirectory}${hashed}`;
    }

    async loadImage(filesystemURI, remoteURI) {
        try {
            // Use the cached image if it exists
            const metadata = await FileSystem.getInfoAsync(filesystemURI);
            if (metadata.exists) {
                this.setState({
                    imgURI: filesystemURI,
                    loading: false
                });
                return;
            }

            // otherwise download to cache
            const imageObject = await FileSystem.downloadAsync(
                remoteURI,
                filesystemURI
            );
            this.setState({
                imgURI: imageObject.uri,
                loading: false
            });
        } catch (err) {
            console.log('Image loading error:', err);
            this.setState({imgURI: remoteURI});
        }
    }

    render() {
        if (this.state.loading && this.props.showActivityIndicator) {
            // while the image is being checked and downloading
            return (
                <View style={this.props.activityIndicatorStyle}>
                    <ActivityIndicator
                        color={this.props.activityIndicatorColor ? this.props.activityIndicatorColor : '#42C2F3'}
                        size={this.props.activityIndicatorSize ? this.props.activityIndicatorSize : 'small'}
                    />
                </View>
            );
        }

        return (
            <View>
                {this.props.isBackground ? (
                    <ImageBackground style={this.props.cachedImageStyles}
                                     {...this.props}
                                     source={this.state.imgURI ? {uri: this.state.imgURI} : null}
                    >
                        {this.props.children}
                    </ImageBackground>
                ) : (
                    <Image style={this.props.cachedImageStyles}
                           {...this.props}
                           source={this.state.imgURI ? {uri: this.state.imgURI} : null}
                    />
                )}
            </View>
        );
    }
}
